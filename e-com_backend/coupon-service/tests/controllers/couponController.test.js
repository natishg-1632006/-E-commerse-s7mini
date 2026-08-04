const controller = require('../../src/controllers/couponController');
const service = require('../../src/services/couponService');

jest.mock('../../src/services/couponService');

describe('couponController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
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
    req.params.couponCode = 'DISCOUNT';
    service.updateCoupon.mockResolvedValue({});
    await controller.updateCoupon(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.updateCoupon.mockRejectedValue(err);
    await controller.updateCoupon(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
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
});
