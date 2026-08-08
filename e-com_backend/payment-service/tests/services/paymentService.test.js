const service = require('../../src/services/paymentService');
const snsService = require('../../src/services/snsService');
const orderApi = require('../../src/utils/orderApi');
const Razorpay = require('razorpay');

jest.mock('../../src/services/snsService');
jest.mock('../../src/utils/orderApi');
jest.mock('razorpay');

describe('paymentService', () => {
  let mockOrdersCreate;

  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    
    mockOrdersCreate = jest.fn();
    Razorpay.mockImplementation(() => {
      return {
        orders: {
          create: mockOrdersCreate,
        },
      };
    });

    process.env.RAZORPAY_KEY_ID = 'rzp_test_TN93PUkmyaRzUI';
    process.env.RAZORPAY_KEY_SECRET = '9QdIvQLHpl2FMW4sFOasXlYv';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'natcart_webhook_secret';

    jest.clearAllMocks();
  });

  test('createRazorpayOrder success and error states', async () => {
    const mockOrder = { orderid: 'o1', userId: 'user-123', totalAmount: 100, orderStatus: 'PENDING', paymentStatus: 'PENDING' };
    orderApi.getOrderById.mockResolvedValue(mockOrder);
    global.docClientSendMock.mockResolvedValue({});
    mockOrdersCreate.mockResolvedValue({ id: 'order_rp123' });

    const res = await service.createRazorpayOrder('o1', 'user-123');
    expect(res.razorpayOrderId).toBe('order_rp123');
    expect(res.amount).toBe(10000); // 100 * 100 paise
    expect(res.keyId).toBe('rzp_test_TN93PUkmyaRzUI');

    // COD/fallback support checks
    const pCOD = await service.createPayment('o1', 'user-123', 'COD');
    expect(pCOD.status).toBe('PAID');

    const pUPIFallback = await service.createPayment('o1', 'user-123', 'UPI');
    expect(pUPIFallback.razorpayOrderId).toBe('order_rp123');

    // Mismatched user error
    orderApi.getOrderById.mockResolvedValue({ ...mockOrder, userId: 'other-user' });
    await expect(service.createRazorpayOrder('o1', 'user-123')).rejects.toThrow('Unauthorized');

    // Already paid error
    orderApi.getOrderById.mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' });
    await expect(service.createRazorpayOrder('o1', 'user-123')).rejects.toThrow('Order is already paid');
  });

  test('verifyPayment handles signature and idempotency', async () => {
    const mockPayment = { paymentid: 'p1', orderId: 'o1', userId: 'user-123', amount: 100, status: 'PENDING', transactionId: 'order_123', razorpayOrderId: 'order_123' };
    
    // Success scenario
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

    // Idempotency check: returns existing PAID payment
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ ...mockPayment, status: 'PAID' }] });
    const resIdem = await service.verifyPayment('o1', 'pay_123', 'order_123', signature, 'user-123');
    expect(resIdem.status).toBe('PAID');

    // Signature mismatch error
    global.docClientSendMock.mockResolvedValueOnce({ Items: [mockPayment] });
    await expect(
      service.verifyPayment('o1', 'pay_123', 'order_123', 'bad-sig', 'user-123')
    ).rejects.toThrow('Invalid payment signature');
  });

  test('handleWebhook processes captured and failed events', async () => {
    const mockPayment = { paymentid: 'p1', orderId: 'o1', userId: 'user-123', amount: 100, status: 'PENDING', razorpayOrderId: 'order_123' };
    
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_captured123',
            order_id: 'order_123',
            amount: 10000,
            method: 'upi'
          }
        }
      }
    };

    const crypto = require('crypto');
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac('sha256', 'natcart_webhook_secret')
      .update(rawBody)
      .digest('hex');

    // Webhook capture success
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [mockPayment] }) // getPaymentByOrderId in scan
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'PAID', transactionId: 'pay_captured123' } }); // update status
    
    snsService.publishPaymentEvent.mockResolvedValue({});
    orderApi.getOrderById.mockResolvedValue({ orderid: 'o1' });

    const res = await service.handleWebhook(rawBody, signature, webhookPayload);
    expect(res.processed).toBe(true);
    expect(res.status).toBe('PAID');

    // Webhook capture idempotency (already PAID)
    const signature2 = crypto
      .createHmac('sha256', 'natcart_webhook_secret')
      .update(rawBody)
      .digest('hex');

    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ ...mockPayment, status: 'PAID' }] });
    const resIdem = await service.handleWebhook(rawBody, signature2, webhookPayload);
    expect(resIdem.status).toBe('already_paid');

    // Webhook failed success
    const failedPayload = { ...webhookPayload, event: 'payment.failed' };
    const rawBodyFailed = JSON.stringify(failedPayload);
    const signatureFailed = crypto
      .createHmac('sha256', 'natcart_webhook_secret')
      .update(rawBodyFailed)
      .digest('hex');

    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [mockPayment] }) // scan
      .mockResolvedValueOnce({ Attributes: { ...mockPayment, status: 'FAILED' } }); // update

    const resFailed = await service.handleWebhook(rawBodyFailed, signatureFailed, failedPayload);
    expect(resFailed.status).toBe('FAILED');
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
    
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(service.updatePaymentStatus('p1', 'PAID')).rejects.toThrow('Payment not found');

    global.docClientSendMock.mockResolvedValueOnce({ Item: mockPayment });
    await expect(service.updatePaymentStatus('p1', 'PAID')).rejects.toThrow('Payment is already PAID');
  });

  test('getAllPayments', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ paymentid: 'p1' }] });
    const res = await service.getAllPayments();
    expect(res).toHaveLength(1);
  });
});
