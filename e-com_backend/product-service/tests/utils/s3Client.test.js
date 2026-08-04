const { s3 } = require('../../src/utils/s3Client');
describe('s3Client utility', () => {
  test('should export s3 client', () => {
    expect(s3).toBeDefined();
  });
});
