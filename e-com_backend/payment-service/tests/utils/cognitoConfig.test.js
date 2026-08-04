const { getCognitoConfig } = require('../../src/config/cognitoConfig');
describe('cognitoConfig', () => {
  test('should return cognito config object', () => {
    const config = getCognitoConfig();
    expect(config).toBeDefined();
    expect(config.userPoolId).toBeDefined();
  });
});
