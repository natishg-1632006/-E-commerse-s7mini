const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, WISHLISTS_TABLE } = require('../utils/db');

const getWishlist = async (userId) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: WISHLISTS_TABLE,
      Key: { userId },
    })
  );
  return result.Item || { userId, products: [] };
};

const addToWishlist = async (userId, productId) => {
  const wishlist = await getWishlist(userId);
  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
  }
  await docClient.send(
    new PutCommand({
      TableName: WISHLISTS_TABLE,
      Item: wishlist,
    })
  );
  return wishlist;
};

const removeFromWishlist = async (userId, productId) => {
  const wishlist = await getWishlist(userId);
  wishlist.products = wishlist.products.filter((id) => id !== productId);
  await docClient.send(
    new PutCommand({
      TableName: WISHLISTS_TABLE,
      Item: wishlist,
    })
  );
  return wishlist;
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
