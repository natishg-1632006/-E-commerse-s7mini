const authMiddleware = require('../../src/middleware/authMiddleware');
const cognitoVerifier = require('../../src/utils/cognitoVerifier');

jest.mock('../../src/utils/cognitoVerifier');
jest.mock('../../src/config/cognitoConfig', () => ({
  getCognitoConfig: jest.fn().mockReturnValue({})
}), { virtual: true });

const cognitoConfig = require('../../src/config/cognitoConfig');

describe('authMiddleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return 401 if auth header is missing', async () => {
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should return 401 if token format is invalid', async () => {
    req.headers.authorization = 'invalid-format';
    cognitoVerifier.extractTokenFromHeader.mockReturnValue(null);
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should verify token and set req.user if valid', async () => {
    req.headers.authorization = 'Bearer valid-token';
    cognitoVerifier.extractTokenFromHeader.mockReturnValue('valid-token');
    cognitoConfig.getCognitoConfig.mockReturnValue({});
    cognitoVerifier.verifyAccessToken.mockResolvedValue({ sub: 'user-123' });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ sub: 'user-123' });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if verification fails', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    cognitoVerifier.extractTokenFromHeader.mockReturnValue('invalid-token');
    const err = new Error('Token verification failed');
    cognitoVerifier.verifyAccessToken.mockRejectedValue(err);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
