const controller = require('../../src/controllers/couponController');
const service = require('../../src/services/couponService');
const { validationResult } = require('express-validator');

jest.mock('../../src/services/couponService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('couponController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
    
    // Default mock behavior is no validation errors
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  test('createCoupon success and error', async () => {
    service.createCoupon.mockResolvedValue({});
    await controller.createCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.createCoupon.mockRejectedValue(err);
    await controller.createCoupon(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('createCoupon validation failure', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid coupon data' }]
    });

    await controller.createCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Validation failed'
    }));
  });

  test('getAllCoupons success and error', async () => {
    service.getAllCoupons.mockResolvedValue([]);
    await controller.getAllCoupons(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getAllCoupons.mockRejectedValue(err);
    await controller.getAllCoupons(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCouponByCode success and error', async () => {
    req.params.couponCode = 'DISCOUNT';
    service.getCouponByCode.mockResolvedValue({});
    await controller.getCouponByCode(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getCouponByCode.mockRejectedValue(err);
    await controller.getCouponByCode(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updateCoupon success and error', async () => {
    service.updateCoupon.mockResolvedValue({});
    await controller.updateCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.updateCoupon.mockRejectedValue(err);
    await controller.updateCoupon(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updateCoupon validation failure', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid update' }]
    });

    await controller.updateCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCoupon success and error', async () => {
    req.params.couponCode = 'DISCOUNT';
    service.deleteCoupon.mockResolvedValue({});
    await controller.deleteCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.deleteCoupon.mockRejectedValue(err);
    await controller.deleteCoupon(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('validateCoupon success and error', async () => {
    service.validateCoupon.mockResolvedValue({ valid: true });
    await controller.validateCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.validateCoupon.mockRejectedValue(err);
    await controller.validateCoupon(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('validateCoupon validation failure', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid validation check' }]
    });

    await controller.validateCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
