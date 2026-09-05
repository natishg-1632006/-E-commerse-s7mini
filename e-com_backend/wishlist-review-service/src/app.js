const AWSXRay = require('aws-xray-sdk');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const brandRoutes = require('./routes/brandRoutes');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('wishlist-review-service'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME || 'wishlist-review-service', timestamp: new Date().toISOString() });
});

app.use(helmet());
app.use(compression());
// Wishlist CORS config
const wishlistOrigins = ['https://d2c24kno5aj17g.cloudfront.net', 'https://d222r50ryi3b71.cloudfront.net', 'http://localhost:3000', 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, done) => {
      const isCloudfront = origin && origin.endsWith('.cloudfront.net');
      const isAllowed = !origin || isCloudfront || wishlistOrigins.indexOf(origin) !== -1 || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin));
      done(null, isAllowed);
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
    service: process.env.SERVICE_NAME,
    version: '1.0.0',
    status: 'running',
    endpoints: {
      wishlist: '/api/v1/wishlist',
      reviews: '/api/v1/reviews',
      brands: '/api/v1/brands',
    },
  });
});

app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/brands', brandRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
