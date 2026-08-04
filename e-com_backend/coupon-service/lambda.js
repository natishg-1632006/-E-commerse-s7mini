require("dotenv").config();

const serverless = require("serverless-http");
const app = require("./src/app");
// Create Lambda
module.exports.handler = serverless(app, {
  request(request, event, context) {
    request.event = event;
    request.context = context;
  },
});