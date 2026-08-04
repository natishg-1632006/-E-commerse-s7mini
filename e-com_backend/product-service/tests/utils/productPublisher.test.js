const { publishProductCreated, publishProductDeleted } = require('../../src/utils/productPublisher');
describe('productPublisher', () => {
  test('publishes product events to SNS', async () => {
    global.snsSendMock.mockResolvedValue({});
    await publishProductCreated({});
    await publishProductDeleted({});
  });
});
