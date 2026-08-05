const AWSXRay = require('aws-xray-sdk');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('product-service'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME || 'product-service', timestamp: new Date().toISOString() });
});

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME,
    version: '1.0.0',
    status: 'running',
    endpoints: {
      products: '/api/v1/products',
    },
  });
});

app.use('/api/v1/products', productRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.closeSegment());
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
