const { PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../utils/fileHandler');

const generateDisplayId = (prefix, seed) => {
  if (!seed) return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 9000) + 100;
  return `${prefix}${num}`;
};

const buildEmptyProfile = (userId, email) => ({
  userId,
  displayId: generateDisplayId('USR', userId),
  email,
  fullName: null,
  phone: null,
  profileImage: '',
  address: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getUserById = async (userId) => {
  console.time("Dynamo");

  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId }
    })
  );

  console.timeEnd("Dynamo");

  if (!Item) return null;
  return {
    ...Item,
    displayId: Item.displayId || generateDisplayId('USR', Item.userId)
  };
};

const getOrCreateProfile = async (userId, email) => {
  const existing = await getUserById(userId);

  if (existing) {
    return existing;
  }

  const profile = buildEmptyProfile(userId, email);
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: profile }));
  return profile;
};

const getProfile = async (userId) => {
  let profile = await getUserById(userId);

  if (!profile) {
    profile = buildEmptyProfile(userId, null);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: profile,
      })
    );
  }

  return profile;
};

const updateProfile = async (userId, data) => {
  const existing = await getUserById(userId);

  if (!existing) {
    const err = new Error('User profile not found');
    err.statusCode = 404;
    throw err;
  }

  const updateFields = {
    fullName: data.fullName !== undefined ? data.fullName : existing.fullName,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    profileImage: data.profileImage !== undefined ? data.profileImage : existing.profileImage,
    address: data.address !== undefined ? data.address : existing.address,
    status: data.status !== undefined ? data.status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'SET fullName = :fullName, phone = :phone, profileImage = :profileImage, #address = :address, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#address': 'address', '#status': 'status' },
      ExpressionAttributeValues: {
        ':fullName': updateFields.fullName,
        ':phone': updateFields.phone,
        ':profileImage': updateFields.profileImage,
        ':address': updateFields.address,
        ':status': updateFields.status !== undefined ? updateFields.status : 'Active',
        ':updatedAt': updateFields.updatedAt,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!Attributes) return null;
  return {
    ...Attributes,
    displayId: Attributes.displayId || generateDisplayId('USR', Attributes.userId)
  };
};

const getAllUsers = async () => {
  const { Items = [] } = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return Items.map(u => ({
    ...u,
    displayId: u.displayId || generateDisplayId('USR', u.userId)
  }));
};

module.exports = {
  buildEmptyProfile,
  getUserById,
  getOrCreateProfile,
  updateProfile,
  getAllUsers,
  getProfile,
};
