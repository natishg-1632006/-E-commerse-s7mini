const { handlePostConfirmation } = require('../../src/handlers/postConfirmationHandler');
const cognitoService = require('../../src/services/cognitoService');

jest.mock('../../src/services/cognitoService');

describe('postConfirmationHandler', () => {
  test('assigns confirmed user to customer group', async () => {
    const event = { userName: 'user123', userPoolId: 'pool123' };
    cognitoService.assignUserToGroup.mockResolvedValue({ success: true });

    const result = await handlePostConfirmation(event);
    expect(result).toBe(event);
    expect(cognitoService.assignUserToGroup).toHaveBeenCalledWith('user123', 'Customer');
  });

  test('throws and handles error if invalid event payload', async () => {
    const event = {};
    const result = await handlePostConfirmation(event);
    expect(result).toBe(event); // handles error and returns event
  });
});
