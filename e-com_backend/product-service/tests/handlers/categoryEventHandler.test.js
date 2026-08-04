const { processCategoryEvent } = require('../../src/services/productService');
describe('categoryEventHandler', () => {
  test('processCategoryEvent completes without error', async () => {
    global.docClientSendMock.mockResolvedValue({ Items: [] });
    await processCategoryEvent({ eventType: 'CATEGORY_UPDATED', categoryId: 'cat1', categoryName: 'New' });
  });
});
