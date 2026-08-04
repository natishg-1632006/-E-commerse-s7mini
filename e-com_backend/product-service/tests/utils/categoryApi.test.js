const { getCategory } = require('../../src/utils/categoryApi');
describe('categoryApi', () => {
  test('getCategory calls category service', async () => {
    global.axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
    await getCategory('cat1');
  });
});
