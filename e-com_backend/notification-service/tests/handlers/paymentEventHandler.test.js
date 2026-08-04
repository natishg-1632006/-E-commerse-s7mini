const { handler } = require('../../src/handlers/paymentEventHandler');
describe('paymentEventHandler', () => {
  test('handler processes payment success event', async () => {
    global.sendMailMock.mockResolvedValue({ messageId: '123' });
    const event = {
      Records: [
        {
          messageId: 'msg1',
          body: JSON.stringify({
            eventType: 'PAYMENT_SUCCESS',
            email: 'test@user.com',
            amount: 100,
            orderId: 'o1'
          })
        }
      ]
    };
    const res = await handler(event);
    expect(res.batchItemFailures).toHaveLength(0);
  });
});
