const AWSXRay = require('aws-xray-sdk');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const notificationRoutes = require('./routes/notificationRoutes');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('notification-service'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME || 'notification-service', timestamp: new Date().toISOString() });
});

app.use(helmet());
app.use(compression());
// Notification CORS config
const notifyAllowed = ['https://d2c24kno5aj17g.cloudfront.net', 'https://d222r50ryi3b71.cloudfront.net', 'http://localhost:3000', 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      const isCloudfront = origin && origin.endsWith('.cloudfront.net');
      const checked = !origin || isCloudfront || notifyAllowed.includes(origin) || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin));
      cb(null, checked);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent']
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME || 'notification-service',
    version: '1.0.0',
    status: 'running',
    endpoints: { notification: '/api/notifications' },
  });
});

app.use('/api/notifications', notificationRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.closeSegment());
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
