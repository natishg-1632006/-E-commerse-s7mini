const controller = require('../../src/controllers/analyticsController');
const service = require('../../src/services/analyticsService');

jest.mock('../../src/services/analyticsService');

describe('analyticsController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: { authorization: 'Bearer token' }, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('getDashboard success and error', async () => {
    service.getDashboardData.mockResolvedValue({ totalRevenue: 100 });
    await controller.getDashboard(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getDashboardData.mockRejectedValue(err);
    await controller.getDashboard(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getRevenue success and error', async () => {
    req.query = { period: 'daily', startDate: '2026-08-01', endDate: '2026-08-04' };
    service.getRevenueAnalytics.mockResolvedValue({});
    await controller.getRevenue(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getRevenueAnalytics.mockRejectedValue(err);
    await controller.getRevenue(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getOrders success and error', async () => {
    service.getOrderAnalytics.mockResolvedValue({});
    await controller.getOrders(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getOrderAnalytics.mockRejectedValue(err);
    await controller.getOrders(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getProducts success and error', async () => {
    service.getProductAnalytics.mockResolvedValue({});
    await controller.getProducts(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getProductAnalytics.mockRejectedValue(err);
    await controller.getProducts(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCategories success and error', async () => {
    service.getCategoryAnalytics.mockResolvedValue({});
    await controller.getCategories(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getCategoryAnalytics.mockRejectedValue(err);
    await controller.getCategories(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCoupons success and error', async () => {
    service.getCouponAnalytics.mockResolvedValue({});
    await controller.getCoupons(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getCouponAnalytics.mockRejectedValue(err);
    await controller.getCoupons(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getInventory success and error', async () => {
    service.getInventoryAnalytics.mockResolvedValue({});
    await controller.getInventory(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getInventoryAnalytics.mockRejectedValue(err);
    await controller.getInventory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getPayments success and error', async () => {
    service.getPaymentAnalytics.mockResolvedValue({});
    await controller.getPayments(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getPaymentAnalytics.mockRejectedValue(err);
    await controller.getPayments(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getHealth success and error', async () => {
    service.getHealthStatus.mockResolvedValue({});
    await controller.getHealth(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.getHealthStatus.mockRejectedValue(err);
    await controller.getHealth(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
