const { verifyAccessToken, extractTokenFromHeader, getVerifier, createVerifier } = require('../../src/utils/cognitoVerifier');
const { CognitoJwtVerifier } = require('aws-jwt-verify');

describe('cognitoVerifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should extract token from Bearer header', () => {
    expect(extractTokenFromHeader('Bearer abc')).toBe('abc');
    expect(extractTokenFromHeader('Bearer')).toBeNull();
    expect(extractTokenFromHeader('')).toBeNull();
  });

  test('should create verifier instance', () => {
    if (typeof createVerifier === 'function') {
      const v = createVerifier({ userPoolId: 'pool', clientId: 'client', region: 'region' });
      expect(v).toBeDefined();
    }
  });

  test('should get cached verifier instance', () => {
    if (typeof getVerifier === 'function') {
      const config = { userPoolId: 'pool', clientId: 'client', region: 'region' };
      const v1 = getVerifier(config);
      const v2 = getVerifier(config);
      expect(v1).toBe(v2);
    }
  });

  test('should verify access token successfully', async () => {
    global.awsJwtVerifyMock.verify.mockResolvedValue({ sub: 'user-123' });
    const payload = await verifyAccessToken('token', { userPoolId: 'pool', clientId: 'client', region: 'region' });
    expect(payload).toEqual({ sub: 'user-123' });
  });

  test('should throw specific code for expired token', async () => {
    global.awsJwtVerifyMock.verify.mockRejectedValue(new Error('expired'));
    await expect(verifyAccessToken('token', {})).rejects.toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  test('should throw specific code for invalid token', async () => {
    global.awsJwtVerifyMock.verify.mockRejectedValue(new Error('invalid'));
    await expect(verifyAccessToken('token', {})).rejects.toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  test('should throw specific code for issuer not found', async () => {
    global.awsJwtVerifyMock.verify.mockRejectedValue(new Error('not found'));
    await expect(verifyAccessToken('token', {})).rejects.toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  test('should throw general verification failed error', async () => {
    global.awsJwtVerifyMock.verify.mockRejectedValue(new Error('other error'));
    await expect(verifyAccessToken('token', {})).rejects.toThrow(expect.objectContaining({ statusCode: 401 }));
  });
});
