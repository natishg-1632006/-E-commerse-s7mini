const service = require('../services/paymentService');
const { success, error } = require('../utils/responseHandler');

const createPayment = async (req, res, next) => {
  try {
    const { orderId,paymentMethod } = req.body;
    const userId=req.user.sub; 
    const payment = await service.createPayment(orderId, userId, paymentMethod);
    success(res, payment, 201);
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user.sub;
    const payment = await service.verifyPayment(
      orderId,
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
  verifyPayment,
  getPayment,
  getPaymentByOrder,
  updatePaymentStatus,
  getAllPayments,
};
