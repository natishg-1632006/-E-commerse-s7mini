const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { v4: uuidv4 } = require("uuid");

const AWSXRay = require('aws-xray-sdk');
let sns = new SNSClient({
  region: process.env.AWS_REGION,
});
if (process.env.NODE_ENV !== 'test') {
  sns = AWSXRay.captureAWSv3Client(sns);
}

const publishOrderCreated = async (order) => {
  const message = {
    eventType: "ORDER_CREATED",
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    email: order.email,
    customerName: order.shippingAddress?.fullName,
    orderId: order.orderid,
    userId: order.userId,
    items: order.items,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    totalAmount: order.totalAmount,

    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
      Subject: "ORDER_CREATED",
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] ORDER_CREATED published for ${order.orderid}`
  );
};

const publishOrderConfirmed = async (order) => {
  const message = {
    eventType: "ORDER_CONFIRMED",
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    email: order.email,
    customerName: order.shippingAddress?.fullName,
    orderId: order.orderid,
    userId: order.userId,
    items: order.items,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,

    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
      Subject: "ORDER_CONFIRMED",
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] ORDER_CONFIRMED published for ${order.orderid}`
  );
};

const publishOrderCancelled = async (order, reason = "USER_CANCELLED") => {
  const message = {
    eventType: "ORDER_CANCELLED",
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),

    orderId: order.orderid,
    userId: order.userId,

    email: order.email,
    customerName: order.shippingAddress?.fullName,

    totalAmount: order.totalAmount,
    items: order.items,

    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,

    reason,
  };

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
      Subject: "ORDER_CANCELLED",
      Message: JSON.stringify(message),
    })
  );

  console.log(
    `[SNS] ORDER_CANCELLED published for ${order.orderid}`
  );
};

const publishOrderStatusChanged = async (order, eventType) => {

  console.log("========== ORDER EVENT ==========");
  console.log("Topic:", process.env.ORDER_EVENTS_TOPIC_ARN);
  console.log("Event:", eventType);
  console.log("OrderId:", order.orderid);
  console.log("Email:", order.email);
  console.log(JSON.stringify(order, null, 2));

  const message = {
    eventType,
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),

    orderId: order.orderid,
    userId: order.userId,

    email: order.email,

    customerName: order.shippingAddress?.fullName,

    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,

    totalAmount: order.totalAmount,

    items: order.items,
  };

  console.log("Publishing Message:");
  console.log(JSON.stringify(message, null, 2));

  await sns.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
      Subject: eventType,
      Message: JSON.stringify(message),
    })
  );

  console.log(`[SNS] ${eventType} published for ${order.orderid}`);
};

module.exports = {
  publishOrderCreated,
  publishOrderConfirmed,
  publishOrderCancelled,
  publishOrderStatusChanged
};