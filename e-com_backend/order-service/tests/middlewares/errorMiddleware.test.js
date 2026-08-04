const errorHandler = require('../../src/middleware/errorMiddleware');
describe('errorMiddleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should format error status and message', () => {
    const err = new Error('Test error');
    err.statusCode = 400;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Test error' }));
  });

  test('should fallback to 500 status code', () => {
    const err = new Error();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('should return stack trace in development mode', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev error');
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stack: err.stack }));
    process.env.NODE_ENV = oldEnv;
  });
});
