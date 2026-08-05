const AWSXRay = require('aws-xray-sdk');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const cartRoutes = require('./routes/cartRoutes');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('cart-service'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME || 'cart-service', timestamp: new Date().toISOString() });
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
    endpoints: { cart: '/api/v1/cart' },
  });
});

app.use('/api/v1/cart', cartRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.closeSegment());
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
