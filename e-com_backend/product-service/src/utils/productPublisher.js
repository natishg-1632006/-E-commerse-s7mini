const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const AWSXRay = require('aws-xray-sdk');
let sns = new SNSClient({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  sns = AWSXRay.captureAWSv3Client(sns);
}

const publishProductCreated = async (product) => {
  const message = {
    eventType: 'PRODUCT_CREATED',
    productId: product.productId,
    name: product.name,
    brand: product.brand,
    category: product.category,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.PRODUCT_EVENTS_TOPIC_ARN,
      Subject: 'PRODUCT_CREATED',
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] PRODUCT_CREATED published for ${product.productId}`
  );
};

const publishProductDeleted = async (product) => {
  const message = {
    eventType: "PRODUCT_DELETED",
    productId: product.productId,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.PRODUCT_EVENTS_TOPIC_ARN,
      Subject: "PRODUCT_DELETED",
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] PRODUCT_DELETED published for ${product.productId}`
  );
};



module.exports = {
  publishProductCreated,
  publishProductDeleted
};