const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const AWSXRay = require('aws-xray-sdk');
let client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  client = AWSXRay.captureAWSv3Client(client);
}

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const ORDERS_TABLE = process.env.DYNAMODB_TABLE_NAME;
const CART_TABLE = process.env.CART_TABLE_NAME;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;

module.exports = {
  docClient,
  ORDERS_TABLE,
  CART_TABLE,
  PRODUCTS_TABLE,
};