const { handler } = require('../../src/handlers/paymentEventHandler');
const service = require('../../src/services/orderService');

jest.mock('../../src/services/orderService');

describe('paymentEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handler processes payment SQS events', async () => {
    const event = {
      Records: [
        {
          messageId: 'm1',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PAYMENT_SUCCESS',
              paymentId: 'pay1',
              orderId: 'o1'
            })
          })
        }
      ]
    };

    service.processPaymentEvent.mockResolvedValue({ success: true });

    const res = await handler(event);
    expect(res.batchItemFailures).toHaveLength(0);
    expect(service.processPaymentEvent).toHaveBeenCalled();
  });

  test('handler logs skip if no records', async () => {
    const res = await handler(null);
    expect(res.batchItemFailures).toHaveLength(0);
  });

  test('handler handles skipped events and errors', async () => {
    const event = {
      Records: [
        {
          messageId: 'm1',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PAYMENT_SUCCESS',
              paymentId: 'pay1',
              orderId: 'o1'
            })
          })
        },
        {
          messageId: 'm2',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PAYMENT_SUCCESS',
              paymentId: 'pay2',
              orderId: 'o2'
            })
          })
        }
      ]
    };

    // First returns skipped: true, second throws error
    service.processPaymentEvent
      .mockResolvedValueOnce({ skipped: true })
      .mockRejectedValueOnce(new Error('Processing error'));

    const res = await handler(event);
    expect(res.batchItemFailures).toHaveLength(1);
    expect(res.batchItemFailures[0].itemIdentifier).toBe('m2');
  });
});
