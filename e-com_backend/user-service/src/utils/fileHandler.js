const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const AWSXRay = require('aws-xray-sdk');

const client = AWSXRay.captureAWSv3Client(new DynamoDBClient({
  region: process.env.AWS_REGION,
}));

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

module.exports = {
  docClient,
  TABLE_NAME,
};
