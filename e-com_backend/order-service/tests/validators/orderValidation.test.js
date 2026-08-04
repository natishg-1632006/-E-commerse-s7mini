const { createOrderRules, updateStatusRules } = require('../../src/validations/orderValidation');
const { runMiddleware } = require('../validationHelper');

describe('orderValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('createOrderRules pass', async () => {
    req.body = {
      email: 'test@example.com',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        pincode: '98101'
      },
      paymentMethod: 'UPI'
    };
    await runMiddleware(req, res, next, createOrderRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('createOrderRules fail', async () => {
    req.body = {};
    await runMiddleware(req, res, next, createOrderRules);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('updateStatusRules pass', async () => {
    req.body = { orderStatus: 'PROCESSING' };
    await runMiddleware(req, res, next, updateStatusRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('updateStatusRules fail', async () => {
    req.body = { orderStatus: 'INVALID' };
    await runMiddleware(req, res, next, updateStatusRules);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
