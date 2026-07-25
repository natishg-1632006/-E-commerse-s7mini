const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REVIEWS_TABLE } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const getProductReviews = async (productId) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: REVIEWS_TABLE,
      IndexName: 'ProductIdIndex',
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId,
      },
    })
  );
  return result.Items || [];
};

const createReview = async ({ productId, userId, username, rating, comment }) => {
  const reviewId = uuidv4();
  const newReview = {
    reviewId,
    productId,
    userId,
    username: username || 'Anonymous User',
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: REVIEWS_TABLE,
      Item: newReview,
    })
  );
  return newReview;
};

module.exports = { getProductReviews, createReview };
