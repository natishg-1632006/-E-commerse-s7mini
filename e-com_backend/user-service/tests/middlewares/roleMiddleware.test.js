const authorize = require('../../src/middleware/roleMiddleware');

describe('roleMiddleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should return 401 if req.user is missing', () => {
    const middleware = authorize('Admin');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should return 403 if user does not have allowed role', () => {
    req.user = { 'cognito:groups': ['Customer'] };
    const middleware = authorize('Admin');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should call next if user has allowed role', () => {
    req.user = { 'cognito:groups': ['Admin'] };
    const middleware = authorize('Admin');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('should handle exception and return 500', () => {
    const badReq = {
      get user() {
        throw new Error('Access error');
      }
    };
    const middleware = authorize('Admin');
    middleware(badReq, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
