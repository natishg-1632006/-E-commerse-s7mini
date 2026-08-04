const snsService = require('../../src/services/snsService');
const orderApi = require('../../src/utils/orderApi');

describe('payment utilities', () => {
  test('publishPaymentEvent sns publishing', async () => {
    global.snsSendMock.mockResolvedValue({});
    await snsService.publishPaymentEvent('PAYMENT_SUCCESS', {});
  });

  test('orderApi retrieves order info', async () => {
    global.axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
    await orderApi.getOrderById('o1', 'token');
  });
});
