const { assignUserToGroup } = require('../../src/services/cognitoService');
describe('cognitoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('assignUserToGroup calls cognito identity provider client', async () => {
    process.env.COGNITO_USER_POOL_ID = 'pool-123';
    global.cognitoSendMock.mockResolvedValue({});
    const res = await assignUserToGroup('user123', 'Customer');
    expect(res.success).toBe(true);
  });

  test('throws error if parameters are missing', async () => {
    await expect(assignUserToGroup('', 'Customer')).rejects.toThrow('Username is required');
    await expect(assignUserToGroup('user123', '')).rejects.toThrow('Group name is required');
  });

  test('throws error if pool id is missing', async () => {
    const oldId = process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_USER_POOL_ID;
    await expect(assignUserToGroup('user123', 'Customer')).rejects.toThrow('COGNITO_USER_POOL_ID is not configured');
    process.env.COGNITO_USER_POOL_ID = oldId;
  });

  test('throws error if adminAddUserToGroup fails', async () => {
    process.env.COGNITO_USER_POOL_ID = 'pool-123';
    global.cognitoSendMock.mockRejectedValue(new Error('Cognito Error'));
    await expect(assignUserToGroup('user123', 'Customer')).rejects.toThrow('Failed to assign user');
  });
});
