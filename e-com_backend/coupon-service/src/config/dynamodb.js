const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

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
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

module.exports = {
  client,
  docClient,
};