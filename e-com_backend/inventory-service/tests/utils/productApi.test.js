const { getProduct } = require('../../src/utils/productApi');
describe('productApi', () => {
  test('getProduct calls service', async () => {
    global.axiosMock.get.mockResolvedValue({ data: { success: true, data: { productId: 'p1' } } });
    await getProduct('p1');
    expect(global.axiosMock.get).toHaveBeenCalled();
  });
});
