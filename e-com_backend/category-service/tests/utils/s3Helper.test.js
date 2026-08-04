const { deleteImageFromS3 } = require('../../src/utils/s3Helper');
describe('s3Helper utility', () => {
  test('should delete image from S3', async () => {
    global.s3SendMock.mockResolvedValue({});
    await deleteImageFromS3('some-key');
    expect(global.s3SendMock).toHaveBeenCalled();
  });
});
