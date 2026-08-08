const service = require('../../src/services/paymentService');
const snsService = require('../../src/services/snsService');
const orderApi = require('../../src/utils/orderApi');

jest.mock('../../src/services/snsService');
jest.mock('../../src/utils/orderApi');

describe('paymentService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'order_TN9HntXyNupYUu' })
    });
    jest.clearAllMocks();
  });

  test('createPayment success for UPI/COD and checks errors', async () => {
    // Normal order success
    const mockOrder = { orderid: 'o1', userId: 'user-123', totalAmount: 100, orderStatus: 'PENDING', paymentStatus: 'PENDING' };
    orderApi.getOrderById.mockResolvedValue(mockOrder);
    global.docClientSendMock.mockResolvedValue({});
    snsService.publishPaymentEvent.mockResolvedValue({});

    const p1 = await service.createPayment('o1', 'user-123', 'UPI');
    expect(p1.status).toBe('PENDING');
    expect(p1.razorpayOrderId).toBe('order_TN9HntXyNupYUu');

    // COD order
    const p2 = await service.createPayment('o1', 'user-123', 'COD');
    expect(p2.transactionId).toContain('COD-');
    expect(p2.status).toBe('PAID');

    // Order not found
    orderApi.getOrderById.mockResolvedValue(null);
    await expect(service.createPayment('o1', 'user-123', 'UPI')).rejects.toThrow('Order not found');

    // User mismatch
    orderApi.getOrderById.mockResolvedValue({ ...mockOrder, userId: 'other-user' });
    await expect(service.createPayment('o1', 'user-123', 'UPI')).rejects.toThrow('Unauthorized');

    // Cancelled order
    orderApi.getOrderById.mockResolvedValue({ ...mockOrder, orderStatus: 'CANCELLED' });
    await expect(service.createPayment('o1', 'user-123', 'UPI')).rejects.toThrow('Cannot create payment');

    // Already paid order
    orderApi.getOrderById.mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' });
    await expect(service.createPayment('o1', 'user-123', 'UPI')).rejects.toThrow('Order is already paid');
  });

  test('verifyPayment handles signature validation and transitions', async () => {
    const mockPayment = { paymentid: 'p1', orderId: 'o1', userId: 'user-123', amount: 100, status: 'PENDING', transactionId: 'order_123', razorpayOrderId: 'order_123' };
    
    // Valid signature
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [mockPayment] }) // getPaymentByOrderId
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'PAID', transactionId: 'pay_123' } }); // UpdateCommand

    snsService.publishPaymentEvent.mockResolvedValue({});

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', '9QdIvQLHpl2FMW4sFOasXlYv')
      .update('order_123|pay_123')
      .digest('hex');

    const res = await service.verifyPayment('o1', 'pay_123', 'order_123', signature, 'user-123');
    expect(res.status).toBe('PAID');
    expect(res.transactionId).toBe('pay_123');

    // Invalid signature
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [mockPayment] }) // getPaymentByOrderId
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'FAILED' } }); // UpdateCommand

    await expect(
      service.verifyPayment('o1', 'pay_123', 'order_123', 'invalid-sig', 'user-123')
    ).rejects.toThrow('Invalid payment signature');
  });

  test('getPaymentById and getPaymentByOrderId', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { paymentid: 'p1' } });
    const p1 = await service.getPaymentById('p1');
    expect(p1.paymentid).toBe('p1');

    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ paymentid: 'p1', orderId: 'o1' }] });
    const p2 = await service.getPaymentByOrderId('o1');
    expect(p2.paymentid).toBe('p1');
  });

  test('updatePaymentStatus handles transitions and errors', async () => {
    const mockPayment = { paymentid: 'p1', orderId: 'o1', userId: 'user-123', amount: 100, status: 'PAID', transactionId: 'txn123' };
    
    // Payment not found
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(service.updatePaymentStatus('p1', 'PAID')).rejects.toThrow('Payment not found');

    // Status already equal
    global.docClientSendMock.mockResolvedValueOnce({ Item: mockPayment });
    await expect(service.updatePaymentStatus('p1', 'PAID')).rejects.toThrow('Payment is already PAID');

    // Refunded payment cannot be updated
    global.docClientSendMock.mockResolvedValueOnce({ Item: { ...mockPayment, status: 'REFUNDED' } });
    await expect(service.updatePaymentStatus('p1', 'PAID')).rejects.toThrow('Cannot update a refunded payment');

    // Paid payment can only move to refunded
    global.docClientSendMock.mockResolvedValueOnce({ Item: mockPayment });
    await expect(service.updatePaymentStatus('p1', 'FAILED')).rejects.toThrow('A paid payment can only be moved to REFUNDED');

    // PAID status update success
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { ...mockPayment, status: 'PENDING' } }) // getPaymentById
      .mockResolvedValueOnce({ Attributes: mockPayment }); // UpdateCommand ReturnValues
    snsService.publishPaymentEvent.mockResolvedValue({});
    const resPaid = await service.updatePaymentStatus('p1', 'PAID', 'txn_new');
    expect(resPaid.status).toBe('PAID');

    // FAILED status update success
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { ...mockPayment, status: 'PENDING' } })
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'FAILED' } });
    const resFailed = await service.updatePaymentStatus('p1', 'FAILED');
    expect(resFailed.status).toBe('FAILED');

    // REFUNDED status update success
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: mockPayment })
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'REFUNDED' } });
    const resRefunded = await service.updatePaymentStatus('p1', 'REFUNDED');
    expect(resRefunded.status).toBe('REFUNDED');
  });

  test('getAllPayments', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ paymentid: 'p1' }] });
    const res = await service.getAllPayments();
    expect(res).toHaveLength(1);
  });
});
