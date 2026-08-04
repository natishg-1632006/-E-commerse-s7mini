const service = require('../../src/services/notificationService');
describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendNotification success paths', async () => {
    global.sendMailMock.mockResolvedValue({ messageId: '123' });
    process.env.NOTIFICATION_OWNER_EMAIL = 'owner@test.com';

    // PAYMENT_SUCCESS event
    const res1 = await service.sendNotification({
      eventType: 'PAYMENT_SUCCESS',
      orderId: 'o1',
      paymentId: 'pay1',
      userId: 'u1',
      paymentMethod: 'UPI',
      amount: 100,
      paymentStatus: 'PAID',
      timestamp: '2026-08-04T10:00:00Z',
      items: [{ name: 'Product A', quantity: 2 }]
    });
    expect(res1.success).toBe(true);

    // ORDER_CANCELLED event REFUNDED
    const res2 = await service.sendNotification({
      eventType: 'ORDER_CANCELLED',
      email: 'user@test.com',
      customerName: 'User',
      orderId: 'o1',
      orderStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      totalAmount: 100
    });
    expect(res2.success).toBe(true);

    // ORDER_CANCELLED event REFUND_PENDING
    const res3 = await service.sendNotification({
      eventType: 'ORDER_CANCELLED',
      email: 'user@test.com',
      customerName: 'User',
      orderId: 'o1',
      orderStatus: 'CANCELLED',
      paymentStatus: 'REFUND_PENDING',
      totalAmount: 100
    });
    expect(res3.success).toBe(true);

    // ORDER_SHIPPED event
    const res4 = await service.sendNotification({
      eventType: 'ORDER_SHIPPED',
      email: 'user@test.com',
      customerName: 'User',
      orderId: 'o1',
      orderStatus: 'SHIPPED',
      totalAmount: 100
    });
    expect(res4.success).toBe(true);
  });

  test('sendNotification invalid input throws', async () => {
    await expect(service.sendNotification(null)).rejects.toThrow('Notification payload is required');
  });
});
