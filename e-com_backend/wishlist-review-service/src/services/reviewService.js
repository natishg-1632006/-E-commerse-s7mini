const { QueryCommand, PutCommand, GetCommand, DeleteCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REVIEWS_TABLE } = require('../utils/db');
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
  return (result.Items || []).map(r => ({
    ...r,
    displayId: r.displayId || generateDisplayId('REV', r.reviewId)
  }));
};

const createReview = async ({ productId, userId, username, rating, comment }) => {
  const reviewId = uuidv4();
  const displayId = generateDisplayId('REV', reviewId);
  const newReview = {
    reviewId,
    displayId,
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

const getReviewById = async (reviewId) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: REVIEWS_TABLE,
      Key: { reviewId },
    })
  );
  if (!result.Item) return null;
  return {
    ...result.Item,
    displayId: result.Item.displayId || generateDisplayId('REV', result.Item.reviewId)
  };
};

const updateReview = async (userId, reviewId, { rating, comment }) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new Error('Review not found.');
  }
  if (review.userId !== userId) {
    throw new Error('Unauthorized to edit this review.');
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: REVIEWS_TABLE,
      Key: { reviewId },
      UpdateExpression: 'SET rating = :rating, #c = :comment, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#c': 'comment',
      },
      ExpressionAttributeValues: {
        ':rating': Number(rating),
        ':comment': comment || '',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  if (!result.Attributes) return null;
  return {
    ...result.Attributes,
    displayId: result.Attributes.displayId || generateDisplayId('REV', result.Attributes.reviewId)
  };
};

const deleteReview = async (userId, reviewId, userRoles = []) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new Error('Review not found.');
  }
  const isAdmin = userRoles.includes('Admin');
  if (review.userId !== userId && !isAdmin) {
    throw new Error('Unauthorized to delete this review.');
  }

  await docClient.send(
    new DeleteCommand({
      TableName: REVIEWS_TABLE,
      Key: { reviewId },
    })
  );
  return { success: true };
};

const getAllReviews = async () => {
  const result = await docClient.send(
    new ScanCommand({
      TableName: REVIEWS_TABLE,
    })
  );
  return (result.Items || []).map(r => ({
    ...r,
    displayId: r.displayId || generateDisplayId('REV', r.reviewId)
  }));
};

module.exports = { getProductReviews, createReview, updateReview, deleteReview, getAllReviews };
