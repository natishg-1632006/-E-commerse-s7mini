const { createRules, updateRules } = require('../../src/validations/inventoryValidation');
const { runMiddleware } = require('../validationHelper');

describe('inventoryValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('createRules pass', async () => {
    req.body = { productId: 'p1', currentStock: 10, lowStockThreshold: 2 };
    await runMiddleware(req, res, next, createRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('updateRules pass', async () => {
    req.body = { lowStockThreshold: 5, status: 'In Stock' };
    await runMiddleware(req, res, next, updateRules);
    expect(res.status).not.toHaveBeenCalled();
  });
});
