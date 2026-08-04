const { docClient } = require('../../src/config/dynamodb');
describe('dynamodb client config', () => {
  test('exports docClient', () => {
    expect(docClient).toBeDefined();
  });
});
