const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { v4: uuidv4 } = require("uuid");

const AWSXRay = require('aws-xray-sdk');
let sns = new SNSClient({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  sns = AWSXRay.captureAWSv3Client(sns);
}

const publishCategoryUpdated = async (category) => {
  const message = {
    eventType: "CATEGORY_UPDATED",
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),

    categoryId: category.categoryId,
    categoryName: category.name,
    status: category.status,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.CATEGORY_EVENTS_TOPIC_ARN,
      Subject: "CATEGORY_UPDATED",
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] CATEGORY_UPDATED published for ${category.categoryId}`
  );
};

module.exports = {
  publishCategoryUpdated,
};