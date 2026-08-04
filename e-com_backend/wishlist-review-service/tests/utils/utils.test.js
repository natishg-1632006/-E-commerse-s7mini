const db = require('../../src/utils/db');

describe('wishlist-review utils', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('db exports docClient', () => {
    expect(db.docClient).toBeDefined();
  });

  test('createTables runs with skips', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({}) // describe wishlists -> exists
      .mockResolvedValueOnce({}); // describe reviews -> exists
    const createTables = require('../../src/utils/createTables');
  });

  test('createTables runs with creation', async () => {
    global.docClientSendMock
      .mockRejectedValueOnce({ name: 'ResourceNotFoundException' }) // describe wishlists -> false
      .mockResolvedValueOnce({}) // create wishlists
      .mockRejectedValueOnce({ name: 'ResourceNotFoundException' }) // describe reviews -> false
      .mockResolvedValueOnce({}); // create reviews
    const createTables = require('../../src/utils/createTables');
  });

  test('createTables runs with unknown error', async () => {
    global.docClientSendMock
      .mockRejectedValueOnce(new Error('Unknown AWS error'));
    
    const originalExit = process.exit;
    process.exit = jest.fn();
    try {
      require('../../src/utils/createTables');
    } catch(e){}
    
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(process.exit).toHaveBeenCalledWith(1);
    process.exit = originalExit;
  });
});
