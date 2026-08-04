const { publishCategoryUpdated } = require('../../src/utils/snsPublisher');
describe('snsPublisher', () => {
  test('publishCategoryUpdated should send SNS message', async () => {
    global.snsSendMock.mockResolvedValue({});
    await publishCategoryUpdated({ categoryId: 'c1', name: 'Electronics' });
    expect(global.snsSendMock).toHaveBeenCalled();
  });
});
