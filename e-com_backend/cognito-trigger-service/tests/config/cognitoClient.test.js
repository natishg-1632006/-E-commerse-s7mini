const { getCognitoClient } = require('../../src/config/cognitoClient');
describe('cognitoClient config', () => {
  test('returns cognito client and caches it', () => {
    const client1 = getCognitoClient();
    expect(client1).toBeDefined();
    const client2 = getCognitoClient();
    expect(client2).toBe(client1);
  });
});
