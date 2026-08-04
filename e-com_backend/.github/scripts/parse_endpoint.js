const fs = require('fs');
const path = require('path');

const logFile = process.argv[2];
if (!logFile || !fs.existsSync(logFile)) {
  console.error('Usage: node parse_endpoint.js <path-to-deploy-log>');
  process.exit(1);
}

const content = fs.readFileSync(logFile, 'utf8');

// Regex for REST API or HTTP API endpoints:
// Matches lines like:
//   https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com
//   https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/dev
const regex = /https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com(?:\/[a-zA-Z0-9_-]+)?/i;
const match = content.match(regex);

if (match) {
  const endpoint = match[0].replace(/\/+$/, ''); // Remove trailing slashes
  console.log(`Extracted Endpoint: ${endpoint}`);
  
  // Write to GitHub actions environment file or GITHUB_OUTPUT
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `endpoint=${endpoint}\n`);
  }
} else {
  console.error('No Serverless API Gateway endpoint found in deployment log.');
  process.exit(1);
}
