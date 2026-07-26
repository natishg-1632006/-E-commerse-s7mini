const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const WISHLISTS_TABLE = process.env.DYNAMODB_WISHLISTS_TABLE || 'natish_wishlists';
const REVIEWS_TABLE = process.env.DYNAMODB_REVIEWS_TABLE || 'natish_reviews';
const BRANDS_TABLE = process.env.DYNAMODB_BRANDS_TABLE || 'natish_brands';

module.exports = { docClient, WISHLISTS_TABLE, REVIEWS_TABLE, BRANDS_TABLE, client };
