const { PutCommand, GetCommand, DeleteCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, BRANDS_TABLE } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

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

const getAllBrands = async () => {
  const result = await docClient.send(
    new ScanCommand({
      TableName: BRANDS_TABLE,
    })
  );
  return (result.Items || []).map(b => ({
    ...b,
    displayId: b.displayId || generateDisplayId('BRD', b.brandId)
  }));
};

const getBrandById = async (brandId) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: BRANDS_TABLE,
      Key: { brandId },
    })
  );
  if (!result.Item) return null;
  return {
    ...result.Item,
    displayId: result.Item.displayId || generateDisplayId('BRD', result.Item.brandId)
  };
};

const createBrand = async ({ name, logoUrl, description }) => {
  if (!name || name.trim() === '') {
    throw new Error('Brand name is required.');
  }

  const brandId = uuidv4();
  const displayId = generateDisplayId('BRD', brandId);
  const newBrand = {
    brandId,
    displayId,
    name: name.trim(),
    logoUrl: logoUrl || '',
    description: description || '',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: BRANDS_TABLE,
      Item: newBrand,
    })
  );
  return newBrand;
};

const updateBrand = async (brandId, { name, logoUrl, description }) => {
  const existing = await getBrandById(brandId);
  if (!existing) {
    throw new Error('Brand not found.');
  }

  const updatedName = name && name.trim() !== '' ? name.trim() : existing.name;
  const updatedLogo = logoUrl !== undefined ? logoUrl : (existing.logoUrl || '');
  const updatedDesc = description !== undefined ? description : (existing.description || '');

  const result = await docClient.send(
    new UpdateCommand({
      TableName: BRANDS_TABLE,
      Key: { brandId },
      UpdateExpression: 'SET #n = :name, logoUrl = :logoUrl, description = :description',
      ExpressionAttributeNames: {
        '#n': 'name',
      },
      ExpressionAttributeValues: {
        ':name': updatedName,
        ':logoUrl': updatedLogo,
        ':description': updatedDesc,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
};

const deleteBrand = async (brandId) => {
  const existing = await getBrandById(brandId);
  if (!existing) {
    throw new Error('Brand not found.');
  }

  await docClient.send(
    new DeleteCommand({
      TableName: BRANDS_TABLE,
      Key: { brandId },
    })
  );
  return { success: true, message: 'Brand deleted successfully.' };
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
