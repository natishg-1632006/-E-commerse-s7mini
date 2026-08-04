const { success, error } = require('../../src/utils/responseHandler');
describe('responseHandler', () => {
  let res;
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('should return success response', () => {
    success(res, { data: 'test' }, 200);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { data: 'test' } }));
  });

  test('should return error response', () => {
    error(res, 'some error', 400);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'some error' });
  });
});
