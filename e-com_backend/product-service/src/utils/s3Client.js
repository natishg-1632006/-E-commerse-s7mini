const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const AWSXRay = require('aws-xray-sdk');
let s3 = new S3Client({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  s3 = AWSXRay.captureAWSv3Client(s3);
}

module.exports = s3;module.exports = {
  s3,
  DeleteObjectCommand,
};