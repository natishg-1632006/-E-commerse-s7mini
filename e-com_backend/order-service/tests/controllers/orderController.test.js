const controller = require('../../src/controllers/orderController');
const service = require('../../src/services/orderService');
const { expirePendingOrders } = require('../../src/services/orderExpirationService');

jest.mock('../../src/services/orderService');
jest.mock('../../src/services/orderExpirationService');

describe('orderController', () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      user: { sub: 'user-123', 'cognito:groups': ['Customer'] },
      body: {},
      params: {},
      query: {},
      headers: { authorization: 'Bearer token' }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('createOrder success and error', async () => {
    service.createOrder.mockResolvedValue({ orderId: 'o1' });
    await controller.createOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.createOrder.mockRejectedValue(err);
    await controller.createOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getAllOrders success and error', async () => {
    service.getAllOrders.mockResolvedValue({ data: [], statistics: {}, meta: {} });
    await controller.getAllOrders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getAllOrders.mockRejectedValue(err);
    await controller.getAllOrders(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getOrderById success, 404, and error', async () => {
    req.params.id = 'o1';
    service.getOrderById.mockResolvedValue({ orderId: 'o1' });
    await controller.getOrderById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.getOrderById.mockResolvedValue(null);
    await controller.getOrderById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.getOrderById.mockRejectedValue(err);
    await controller.getOrderById(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getOrdersByUser success and error', async () => {
    req.params.userId = 'user-123';
    service.getOrdersByUser.mockResolvedValue([]);
    await controller.getOrdersByUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getOrdersByUser.mockRejectedValue(err);
    await controller.getOrdersByUser(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updateOrderStatus success and error', async () => {
    req.params.id = 'o1';
    req.body = { orderStatus: 'PROCESSING' };
    service.updateOrderStatus.mockResolvedValue({ orderId: 'o1' });
    await controller.updateOrderStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.updateOrderStatus.mockRejectedValue(err);
    await controller.updateOrderStatus(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('cancelOrder success and error', async () => {
    req.params.id = 'o1';
    service.cancelOrder.mockResolvedValue({ orderId: 'o1' });
    await controller.cancelOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.cancelOrder.mockRejectedValue(err);
    await controller.cancelOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('downloadInvoice success, ownership check, 404, and error', async () => {
    req.params.id = 'o1';
    
    // 404
    service.getOrderById.mockResolvedValue(null);
    await controller.downloadInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    // Forbidden (not Admin, and different owner sub)
    service.getOrderById.mockResolvedValue({ orderId: 'o1', userId: 'other-user' });
    await controller.downloadInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);

    // Missing cognito:groups key on req.user
    delete req.user['cognito:groups'];
    service.getOrderById.mockResolvedValue({ orderId: 'o1', userId: 'other-user' });
    await controller.downloadInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);

    // Allowed - Owner
    service.getOrderById.mockResolvedValue({ orderId: 'o1', userId: 'user-123' });
    service.generateInvoicePdf.mockResolvedValue({});
    await controller.downloadInvoice(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');

    // Allowed - Admin
    req.user['cognito:groups'] = ['Admin'];
    service.getOrderById.mockResolvedValue({ orderId: 'o1', userId: 'other-user' });
    await controller.downloadInvoice(req, res, next);
    expect(res.setHeader).toHaveBeenCalled();

    // Error
    const err = new Error('fail');
    service.getOrderById.mockRejectedValue(err);
    await controller.downloadInvoice(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('expirePending success and error', async () => {
    expirePendingOrders.mockResolvedValue({ expired: 2 });
    await controller.expirePending(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    expirePendingOrders.mockRejectedValue(err);
    await controller.expirePending(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
