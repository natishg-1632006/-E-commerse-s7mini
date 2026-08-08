const service = require('../services/paymentService');
const { success, error } = require('../utils/responseHandler');

const createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.sub; 
    const payment = await service.createPayment(orderId, userId, paymentMethod);
    success(res, payment, 201);
  } catch (err) {
    next(err);
  }
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.sub;
    const orderData = await service.createRazorpayOrder(orderId, userId);
    success(res, orderData, 201);
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { internalOrderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user.sub;
    const payment = await service.verifyPayment(
      internalOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      userId
    );
    success(res, payment);
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const event = await service.handleWebhook(req.rawBody, signature, req.body);
    success(res, { received: true, event });
  } catch (err) {
    next(err);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await service.getPaymentById(req.params.id);
    if (!payment) return error(res, 'Payment not found', 404);
    success(res, payment);
  } catch (err) {
    next(err);
  }
};

const getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await service.getPaymentByOrderId(req.params.orderId);
    if (!payment) return error(res, 'Payment not found for this order', 404);
    success(res, payment);
  } catch (err) {
    next(err);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, transactionId } = req.body;
    const payment = await service.updatePaymentStatus(req.params.id, status, transactionId);
    success(res, payment);
  } catch (err) {
    next(err);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const payments = await service.getAllPayments();
    success(res, payments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPayment,
  getPaymentByOrder,
  updatePaymentStatus,
  getAllPayments,
};
