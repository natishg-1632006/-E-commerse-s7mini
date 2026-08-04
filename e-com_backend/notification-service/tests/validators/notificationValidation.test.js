const { sendRules } = require('../../src/validations/notificationValidation');
const { runMiddleware } = require('../validationHelper');

describe('notificationValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('sendRules pass', async () => {
    req.body = { eventType: 'PAYMENT_SUCCESS', email: 'user@test.com' };
    await runMiddleware(req, res, next, sendRules);
    expect(res.status).not.toHaveBeenCalled();
  });
});
