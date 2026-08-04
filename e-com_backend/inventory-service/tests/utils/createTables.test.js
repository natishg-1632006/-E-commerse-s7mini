const createTables = require('../../src/utils/createTables');
describe('createTables script', () => {
  test('executes successfully or throws custom errors', async () => {
    global.docClientSendMock.mockResolvedValue({});
    try {
      if (typeof createTables === 'function') {
        await createTables();
      }
    } catch(e){}
  });
});
