const { createRules, updateRules } = require('../../src/validations/categoryValidation');
const { runMiddleware } = require('../validationHelper');

describe('categoryValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('createRules pass', async () => {
    req.body = { name: 'Electronics' };
    await runMiddleware(req, res, next, createRules);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('createRules fail', async () => {
    req.body = { name: '' };
    await runMiddleware(req, res, next, createRules);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
