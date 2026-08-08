const { body, validationResult } = require('express-validator');
const { PAYMENT_STATUS } = require('../constants/paymentConstants');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

const createPaymentRules = [
  body('orderId').trim().notEmpty().withMessage('orderId is required'),
  body('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('paymentMethod is required')
    .isIn(['COD', 'Card', 'UPI', 'NetBanking'])
    .withMessage('paymentMethod must be COD, Card, UPI or NetBanking'),
  handleValidation,
];

const createRazorpayOrderRules = [
  body('orderId').trim().notEmpty().withMessage('orderId is required'),
  handleValidation,
];

const updateStatusRules = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('status is required')
    .isIn(Object.values(PAYMENT_STATUS).filter((s) => s !== PAYMENT_STATUS.PENDING))
    .withMessage(`status must be one of: ${[PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REFUNDED].join(', ')}`),
  handleValidation,
];

const verifyPaymentRules = [
  body('internalOrderId').trim().notEmpty().withMessage('internalOrderId is required'),
  body('razorpayPaymentId').trim().notEmpty().withMessage('razorpayPaymentId is required'),
  body('razorpayOrderId').trim().notEmpty().withMessage('razorpayOrderId is required'),
  body('razorpaySignature').trim().notEmpty().withMessage('razorpaySignature is required'),
  handleValidation,
];

module.exports = {
  createPaymentRules,
  createRazorpayOrderRules,
  updateStatusRules,
  verifyPaymentRules,
};
