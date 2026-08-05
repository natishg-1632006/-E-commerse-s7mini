const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { v4: uuidv4 } = require('uuid');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';
const TOPIC_ARN = process.env.PAYMENT_EVENTS_TOPIC_ARN;

const AWSXRay = require('aws-xray-sdk');
let snsClient = new SNSClient({ region: REGION });
if (process.env.NODE_ENV !== 'test') {
  snsClient = AWSXRay.captureAWSv3Client(snsClient);
}

const publishPaymentEvent = async (eventType, payment = {}, order = {}) => {
  const eventId = uuidv4();
  const timestamp = new Date().toISOString();

  const payload = {
    source: 'payment-service',
    version: '1.0',
    eventType,
    eventId,
    paymentId: payment.paymentid || payment.paymentId || null,
    orderId: payment.orderId || order.orderid || null,
    userId: payment.userId || order.userId || null,
    paymentStatus: payment.status || null,
    paymentMethod: payment.paymentMethod || null,
    amount: payment.amount || null,
    items: (order.items || []).map((i) => ({ productId: i.productId, quantity: i.quantity })),
    timestamp,
  };

  console.log(`[SNS] Publishing ${eventType}`);
  console.log('[SNS] Topic ARN:', TOPIC_ARN);
  console.log('[SNS] Event Payload:', JSON.stringify(payload));

  const cmd = new PublishCommand({
    TopicArn: process.env.PAYMENT_EVENTS_TOPIC_ARN,
    Subject: eventType,
    Message: JSON.stringify(payload),
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: eventType,
      },
    },
  });

  try {
    const res = await snsClient.send(cmd);
    console.log('[SNS] MessageId:', res.MessageId);
    console.log('[SNS] Publish Success');
    return { messageId: res.MessageId, eventId };
  } catch (err) {
    console.error('[SNS] Publish Error');
    console.error(err);
    throw err;
  }
};

module.exports = { publishPaymentEvent };