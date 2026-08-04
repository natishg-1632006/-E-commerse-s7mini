const controller = require('../../src/controllers/paymentController');
const service = require('../../src/services/paymentService');

jest.mock('../../src/services/paymentService');

describe('paymentController', () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      user: { sub: 'user-123' },
      body: {},
      params: {},
      headers: { authorization: 'Bearer token' }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('createPayment success and error', async () => {
    req.body = { orderId: 'o1', paymentMethod: 'UPI' };
    service.createPayment.mockResolvedValue({ paymentid: 'p1' });
    await controller.createPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.createPayment.mockRejectedValue(err);
    await controller.createPayment(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getPayment success, 404, and error', async () => {
    req.params.id = 'p1';
    service.getPaymentById.mockResolvedValue({ paymentid: 'p1' });
    await controller.getPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.getPaymentById.mockResolvedValue(null);
    await controller.getPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.getPaymentById.mockRejectedValue(err);
    await controller.getPayment(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getPaymentByOrder success, 404, and error', async () => {
    req.params.orderId = 'o1';
    service.getPaymentByOrderId.mockResolvedValue({ paymentid: 'p1' });
    await controller.getPaymentByOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.getPaymentByOrderId.mockResolvedValue(null);
    await controller.getPaymentByOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.getPaymentByOrderId.mockRejectedValue(err);
    await controller.getPaymentByOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updatePaymentStatus success and error', async () => {
    req.params.id = 'p1';
    req.body = { status: 'REFUNDED', transactionId: 'txn123' };
    service.updatePaymentStatus.mockResolvedValue({ paymentid: 'p1' });
    await controller.updatePaymentStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.updatePaymentStatus.mockRejectedValue(err);
    await controller.updatePaymentStatus(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getAllPayments success and error', async () => {
    service.getAllPayments.mockResolvedValue([]);
    await controller.getAllPayments(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getAllPayments.mockRejectedValue(err);
    await controller.getAllPayments(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
