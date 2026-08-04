const controller = require('../../src/controllers/userController');
const service = require('../../src/services/userService');

jest.mock('../../src/services/userService');

describe('userController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { user: { sub: 'user-123' }, body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('getProfile success and error', async () => {
    service.getProfile.mockResolvedValue({ userId: 'user-123' });
    await controller.getProfile(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getProfile.mockRejectedValue(new Error('fail'));
    await controller.getProfile(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('updateProfile success and error', async () => {
    service.updateProfile.mockResolvedValue({ userId: 'user-123' });
    await controller.updateProfile(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.updateProfile.mockRejectedValue(new Error('fail'));
    await controller.updateProfile(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getAllUsers success and error', async () => {
    service.getAllUsers.mockResolvedValue([]);
    await controller.getAllUsers(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getAllUsers.mockRejectedValue(new Error('fail'));
    await controller.getAllUsers(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getUserById success, 404, and error', async () => {
    req.params.userId = 'user-123';
    service.getUserById.mockResolvedValue({ userId: 'user-123' });
    await controller.getUserById(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getUserById.mockResolvedValue(null);
    await controller.getUserById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    service.getUserById.mockRejectedValue(new Error('fail'));
    await controller.getUserById(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('updateUserByIdAdmin success and error', async () => {
    req.params.userId = 'user-123';
    service.updateProfile.mockResolvedValue({ userId: 'user-123' });
    await controller.updateUserByIdAdmin(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.updateProfile.mockRejectedValue(new Error('fail'));
    await controller.updateUserByIdAdmin(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
