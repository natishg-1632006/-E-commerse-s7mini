const AWSXRay = require('aws-xray-sdk');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const couponRoutes = require("./routes/couponRoutes");

// Import your existing middleware
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(AWSXRay.express.openSegment('coupon-service'));
}

// Security
app.use(helmet());

// Enable CORS
// Coupon CORS config
const couponOrigins = ['https://d222r50ryi3b71.cloudfront.net', 'http://localhost:3000', 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      const isOk = !origin || couponOrigins.indexOf(origin) !== -1 || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin));
      cb(null, isOk);
    }
  })
);

// Compression
app.use(compression());

// Logging
app.use(morgan("dev"));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (
    req.body &&
    req.body.type === "Buffer" &&
    Array.isArray(req.body.data)
  ) {
    try {
      req.body = JSON.parse(
        Buffer.from(req.body.data).toString("utf8")
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON body",
      });
    }
  }

  next();
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: process.env.SERVICE_NAME,
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME,
    version: "1.0.0",
    status: "running",
    endpoints: { coupons: "/api/v1/coupons" },
  });
});

// API Routes
app.use("/api/v1/coupons", couponRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;