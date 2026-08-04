const { getProductById } = require('../../src/utils/productApi');
describe('productApi', () => {
  test('getProductById calls DynamoDB client', async () => {
    global.docClientSendMock.mockResolvedValue({ Item: { productId: 'p1' } });
    const product = await getProductById('p1');
    expect(product.productId).toBe('p1');
  });
});
