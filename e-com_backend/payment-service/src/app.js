const AWSXRay = require('aws-xray-sdk');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const paymentRoutes = require('./routes/paymentRoutes');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('payment-service'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME || 'payment-service', timestamp: new Date().toISOString() });
});

app.use(helmet());
app.use(compression());
// Payment CORS config
const payAllowedOrigins = ['https://d2c24kno5aj17g.cloudfront.net', 'https://d222r50ryi3b71.cloudfront.net', 'http://localhost:3000', 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      const isCloudfront = origin && origin.endsWith('.cloudfront.net');
      const verifyOrigin = !origin || isCloudfront || payAllowedOrigins.indexOf(origin) !== -1 || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin));
      cb(null, verifyOrigin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent']
  })
);
app.use(morgan('dev'));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.get('/api', (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME,
    version: '1.0.0',
    status: 'running',
    endpoints: { payment: '/api/v1/payment' },
  });
});

app.use('/api/v1/payment', paymentRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.closeSegment());
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
