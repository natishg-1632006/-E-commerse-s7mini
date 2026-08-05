const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const AWSXRay = require('aws-xray-sdk');
let client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  client = AWSXRay.captureAWSv3Client(client);
}

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

module.exports = { docClient, TABLE_NAME };