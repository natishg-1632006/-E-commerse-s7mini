const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const AWSXRay = require('aws-xray-sdk');
let client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});
if (process.env.NODE_ENV !== 'test') {
  client = AWSXRay.captureAWSv3Client(client);
}

const docClient = DynamoDBDocumentClient.from(client);

const WISHLISTS_TABLE = process.env.DYNAMODB_WISHLISTS_TABLE || 'natish_wishlists';
const REVIEWS_TABLE = process.env.DYNAMODB_REVIEWS_TABLE || 'natish_reviews';
const BRANDS_TABLE = process.env.DYNAMODB_BRANDS_TABLE || 'natish_brands';

module.exports = { docClient, WISHLISTS_TABLE, REVIEWS_TABLE, BRANDS_TABLE, client };
