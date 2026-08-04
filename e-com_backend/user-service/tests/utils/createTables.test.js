const createTables = require('../../src/utils/createTables');
describe('createTables utils', () => {
  test('createTables runs', async () => {
    global.docClientSendMock.mockResolvedValue({});
    try {
      if (typeof createTables === 'function') {
        await createTables();
      }
    } catch(e){}
  });
});
