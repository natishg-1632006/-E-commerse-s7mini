require('dotenv').config();

const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { client, WISHLISTS_TABLE, REVIEWS_TABLE } = require('./db');

const tableExists = async (tableName) => {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') return false;
    throw err;
  }
};

const createWishlistsTable = async () => {
  if (await tableExists(WISHLISTS_TABLE)) {
    console.log(`[SKIP] Table "${WISHLISTS_TABLE}" already exists.`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName: WISHLISTS_TABLE,
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );
  console.log(`[CREATED] Table "${WISHLISTS_TABLE}" created successfully.`);
};

const createReviewsTable = async () => {
  if (await tableExists(REVIEWS_TABLE)) {
    console.log(`[SKIP] Table "${REVIEWS_TABLE}" already exists.`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName: REVIEWS_TABLE,
      AttributeDefinitions: [
        { AttributeName: 'reviewId', AttributeType: 'S' },
        { AttributeName: 'productId', AttributeType: 'S' }
      ],
      KeySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ProductIdIndex',
          KeySchema: [{ AttributeName: 'productId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        }
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
  );
  console.log(`[CREATED] Table "${REVIEWS_TABLE}" created successfully.`);
};

const run = async () => {
  console.log('Setting up DynamoDB tables for wishlist-review-service...\n');
  await createWishlistsTable();
  await createReviewsTable();
  console.log('\nDone.');
};

run().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
