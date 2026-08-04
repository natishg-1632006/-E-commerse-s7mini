const { createPaymentRules, updateStatusRules } = require('../../src/validations/paymentValidation');
const { runMiddleware } = require('../validationHelper');

describe('paymentValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('createPaymentRules pass', async () => {
    req.body = { orderId: 'o1', paymentMethod: 'UPI' };
    await runMiddleware(req, res, next, createPaymentRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('updateStatusRules pass', async () => {
    req.body = { status: 'PAID' };
    await runMiddleware(req, res, next, updateStatusRules);
    expect(res.status).not.toHaveBeenCalled();
  });
});
