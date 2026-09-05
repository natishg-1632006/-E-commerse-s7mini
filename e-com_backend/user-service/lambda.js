try { require('dotenv').config(); } catch (_) {}

const serverless = require('serverless-http');
const app = require('./src/app');

const httpHandler = serverless(app);

module.exports.handler = async (event, context) => {
  return httpHandler(event, context);
};
