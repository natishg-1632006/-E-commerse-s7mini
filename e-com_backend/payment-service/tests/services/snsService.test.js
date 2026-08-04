const { publishPaymentEvent } = require('../../src/services/snsService');
describe('snsService', () => {
  test('publishPaymentEvent publishes to SNS successfully', async () => {
    global.snsSendMock.mockResolvedValue({ MessageId: '123' });
    const res = await publishPaymentEvent('PAYMENT_SUCCESS', { paymentid: 'p1' }, { orderid: 'o1' });
    expect(res.messageId).toBe('123');
  });

  test('publishPaymentEvent throws error on client fail', async () => {
    global.snsSendMock.mockRejectedValue(new Error('fail'));
    await expect(publishPaymentEvent('PAYMENT_SUCCESS')).rejects.toThrow('fail');
  });
});
