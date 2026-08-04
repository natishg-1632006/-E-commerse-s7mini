const { addToCartRules, updateCartRules } = require('../../src/validations/cartValidation');
const { runMiddleware } = require('../validationHelper');

describe('cartValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('addToCartRules pass', async () => {
    req.body = { productId: 'p1', quantity: 2 };
    await runMiddleware(req, res, next, addToCartRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('addToCartRules fail', async () => {
    req.body = { productId: '', quantity: 0 };
    await runMiddleware(req, res, next, addToCartRules);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
