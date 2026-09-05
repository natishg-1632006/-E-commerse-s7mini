try { require('dotenv').config(); } catch (_) {}
const serverless = require('serverless-http');   
const app = require('./src/app');  
module.exports.handler = serverless(app);