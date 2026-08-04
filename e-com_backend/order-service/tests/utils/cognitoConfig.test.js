const { getCognitoConfig, validateCognitoConfig, cognitoConfig } = require('../../src/config/cognitoConfig');

describe('cognitoConfig', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  test('should return cognito config object if all env vars are present', () => {
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.COGNITO_USER_POOL_ID = 'pool-id';
    process.env.COGNITO_CLIENT_ID = 'client-id';

    cognitoConfig.region = 'ap-southeast-1';
    cognitoConfig.userPoolId = 'pool-id';
    cognitoConfig.clientId = 'client-id';

    const config = getCognitoConfig();
    expect(config.region).toBe('ap-southeast-1');
  });

  test('should throw error if AWS_REGION is missing', () => {
    cognitoConfig.region = undefined;
    expect(() => validateCognitoConfig()).toThrow('Missing required Cognito environment variables: AWS_REGION');
  });

  test('should throw error if COGNITO_USER_POOL_ID is missing', () => {
    cognitoConfig.region = 'ap-southeast-1';
    cognitoConfig.userPoolId = undefined;
    expect(() => validateCognitoConfig()).toThrow('Missing required Cognito environment variables: COGNITO_USER_POOL_ID');
  });

  test('should throw error if COGNITO_CLIENT_ID is missing', () => {
    cognitoConfig.region = 'ap-southeast-1';
    cognitoConfig.userPoolId = 'pool-id';
    cognitoConfig.clientId = undefined;
    expect(() => validateCognitoConfig()).toThrow('Missing required Cognito environment variables: COGNITO_CLIENT_ID');
  });
});
