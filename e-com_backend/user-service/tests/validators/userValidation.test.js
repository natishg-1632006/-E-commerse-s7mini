const { profileUpdateRules } = require('../../src/validations/userValidation');
const { runMiddleware } = require('../validationHelper');

describe('userValidation', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('profileUpdateRules pass', async () => {
    req.body = { fullName: 'John Doe', phone: '1234567890' };
    await runMiddleware(req, res, next, profileUpdateRules);
    expect(res.status).not.toHaveBeenCalled();
  });
});
