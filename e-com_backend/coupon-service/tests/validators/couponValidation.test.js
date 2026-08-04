const { createCouponValidation, validateCouponValidation } = require('../../src/validations/couponValidation');
const { runMiddleware } = require('../validationHelper');

describe('couponValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('createCouponValidation pass', async () => {
    req.body = { couponCode: 'DISCOUNT', couponName: 'Discount', discountType: 'FIXED', discountValue: 10, minimumOrderAmount: 100, expiryDate: '2026-08-04T10:00:00Z' };
    await runMiddleware(req, res, next, createCouponValidation);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('validateCouponValidation pass', async () => {
    req.body = { couponCode: 'DISCOUNT', cartTotal: 100 };
    await runMiddleware(req, res, next, validateCouponValidation);
    expect(res.status).not.toHaveBeenCalled();
  });
});
