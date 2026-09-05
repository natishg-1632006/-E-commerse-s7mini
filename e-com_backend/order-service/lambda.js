try { require('dotenv').config(); } catch (_) {}

const serverless = require('serverless-http');
const app = require('./src/app');
const paymentEventHandler = require('./src/handlers/paymentEventHandler');

const httpHandler = serverless(app, {
  binary: ['application/pdf']
});

module.exports.handler = async (event, context) => {
  if (event && event.Records && event.Records[0].eventSource === 'aws:sqs') {
    return paymentEventHandler.handler(event, context);
  }

  return httpHandler(event, context);
};