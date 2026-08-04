const fileHandler = require('../../src/utils/fileHandler');
describe('fileHandler utility', () => {
  test('should export docClient and TABLE_NAME', () => {
    expect(fileHandler.docClient).toBeDefined();
  });
});
