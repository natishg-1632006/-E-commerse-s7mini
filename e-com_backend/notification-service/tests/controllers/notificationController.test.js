const controller = require('../../src/controllers/notificationController');
const notificationService = require('../../src/services/notificationService');

jest.mock('../../src/services/notificationService');

describe('notificationController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('sendTestNotification success and error', async () => {
    req.body = { eventType: 'PAYMENT_SUCCESS', email: 'user@example.com' };
    notificationService.sendNotification.mockResolvedValue({ success: true });
    await controller.sendTestNotification(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    notificationService.sendNotification.mockRejectedValue(err);
    await controller.sendTestNotification(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('healthCheck success and error', async () => {
    await controller.healthCheck(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
