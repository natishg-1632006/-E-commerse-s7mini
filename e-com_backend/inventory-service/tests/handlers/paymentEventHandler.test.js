const { handler } = require('../../src/handlers/paymentEventHandler');
const service = require('../../src/services/inventoryService');

jest.mock('../../src/services/inventoryService');

describe('paymentEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handler processes inventory events', async () => {
    const event = {
      Records: [
        {
          messageId: 'm1',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PAYMENT_SUCCESS',
              orderId: 'o1',
              items: []
            })
          })
        },
        {
          messageId: 'm2',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PRODUCT_CREATED',
              productId: 'p1'
            })
          })
        },
        {
          messageId: 'm3',
          body: JSON.stringify({
            Message: JSON.stringify({
              eventType: 'PRODUCT_DELETED',
              productId: 'p1'
            })
          })
        }
      ]
    };

    service.processPaymentEvent.mockResolvedValue({});
    service.processProductCreatedEvent.mockResolvedValue({});
    service.processProductDeletedEvent.mockResolvedValue({});

    const res = await handler(event);
    expect(res.batchItemFailures).toHaveLength(0);
  });

  test('handler logs skip if no records', async () => {
    const res = await handler(null);
    expect(res.batchItemFailures).toHaveLength(0);
  });
});
