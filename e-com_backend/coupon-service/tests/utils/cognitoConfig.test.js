const { getCognitoConfig } = require('../../src/config/cognitoConfig');

describe('cognitoConfig validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('should return cognito config object if variables exist', () => {
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.COGNITO_USER_POOL_ID = 'pool123';
    process.env.COGNITO_CLIENT_ID = 'client123';
    
    // Clear cache to re-initialize values
    delete require.cache[require.resolve('../../src/config/cognitoConfig')];
    const { getCognitoConfig } = require('../../src/config/cognitoConfig');

    const config = getCognitoConfig();
    expect(config).toBeDefined();
    expect(config.userPoolId).toBe('pool123');
  });

  test('should throw error if AWS_REGION is missing', () => {
    delete process.env.AWS_REGION;
    delete require.cache[require.resolve('../../src/config/cognitoConfig')];
    const { getCognitoConfig } = require('../../src/config/cognitoConfig');

    expect(() => getCognitoConfig()).toThrow('Missing required Cognito environment variables');
  });

  test('should throw error if COGNITO_USER_POOL_ID is missing', () => {
    delete process.env.COGNITO_USER_POOL_ID;
    delete require.cache[require.resolve('../../src/config/cognitoConfig')];
    const { getCognitoConfig } = require('../../src/config/cognitoConfig');

    expect(() => getCognitoConfig()).toThrow('Missing required Cognito environment variables');
  });

  test('should throw error if COGNITO_CLIENT_ID is missing', () => {
    delete process.env.COGNITO_CLIENT_ID;
    delete require.cache[require.resolve('../../src/config/cognitoConfig')];
    const { getCognitoConfig } = require('../../src/config/cognitoConfig');

    expect(() => getCognitoConfig()).toThrow('Missing required Cognito environment variables');
  });
});
