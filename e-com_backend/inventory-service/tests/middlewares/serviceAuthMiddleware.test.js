const serviceAuthMiddleware = require('../../src/middleware/serviceAuthMiddleware');
describe('serviceAuthMiddleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('should return 401 if service key is missing', () => {
    serviceAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should call next if service key is valid', () => {
    process.env.INTERNAL_SERVICE_KEY = 'secret-key';
    req.headers['x-service-key'] = 'secret-key';
    serviceAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
