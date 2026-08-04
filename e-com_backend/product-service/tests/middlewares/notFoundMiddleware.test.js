const notFound = require('../../src/middleware/notFoundMiddleware');
describe('notFoundMiddleware', () => {
  test('should return 404', () => {
    const req = { originalUrl: '/test' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    notFound(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
