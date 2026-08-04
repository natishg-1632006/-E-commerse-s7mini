jest.mock('../../src/utils/cartApi');
jest.mock('../../src/utils/couponClient');
jest.mock('../../src/utils/inventoryApi');
jest.mock('../../src/utils/userApi');
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const doc = {
      pipedRes: null,
      listeners: {},
      on: jest.fn().mockImplementation(function(event, cb) {
        doc.listeners[event] = cb;
        if (event === 'end') cb();
        return proxy;
      }),
      pipe: jest.fn().mockImplementation(function(res) {
        doc.pipedRes = res;
        return proxy;
      }),
      end: jest.fn().mockImplementation(function() {
        setImmediate(() => {
          if (doc.pipedRes) {
            if (typeof doc.pipedRes.end === 'function') doc.pipedRes.end();
            const finishListeners = doc.pipedRes.on.mock.calls.filter(c => c[0] === 'finish');
            for (const listener of finishListeners) {
              listener[1]();
            }
          }
        });
        return proxy;
      }),
    };

    const proxy = new Proxy(doc, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        return jest.fn().mockReturnValue(proxy);
      }
    });

    return proxy;
  });
});

const service = require('../../src/services/orderService');
const cartApi = require('../../src/utils/cartApi');
const couponClient = require('../../src/utils/couponClient');
const inventoryApi = require('../../src/utils/inventoryApi');
const userApi = require('../../src/utils/userApi');

describe('orderService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    global.snsSendMock.mockReset();
    global.snsSendMock.mockResolvedValue({});
    jest.clearAllMocks();
  });

  test('createOrder handles full lifecycle successfully with coupon', async () => {
    cartApi.getCartByUserId.mockResolvedValue({ items: [{ productId: 'p1', quantity: 2, price: 50, subtotal: 100 }] });
    userApi.getProfile.mockResolvedValue({ address: { address: 'Addr', city: 'City', state: 'St', pincode: '123' }, fullName: 'User', phone: '123' });
    cartApi.getProductsByIds.mockResolvedValue([{ productId: 'p1', price: 50, name: 'P' }]);
    inventoryApi.checkStockBatch.mockResolvedValue([{ productId: 'p1', availableStock: 10, exists: true, isAvailable: true }]);
    couponClient.validateCoupon.mockResolvedValue({ couponCode: 'SAVE10', couponName: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, discount: 10, finalAmount: 90 });
    inventoryApi.reserveStockBatch.mockResolvedValue({ success: true });
    cartApi.clearCart.mockResolvedValue({});

    global.docClientSendMock.mockResolvedValue({});

    const order = await service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token', 'SAVE10');
    expect(order).toBeDefined();
    expect(order.discountAmount).toBe(10);
    expect(order.totalAmount).toBe(90);
  });

  test('createOrder throws error if cart is empty or null, and updates profile if incomplete', async () => {
    cartApi.getCartByUserId.mockResolvedValue(null);
    await expect(service.createOrder('user-123', 'test@test.com', {}, 'UPI', 'token')).rejects.toThrow('Cart not found for this user');

    cartApi.getCartByUserId.mockResolvedValue({ items: [] });
    await expect(service.createOrder('user-123', 'test@test.com', {}, 'UPI', 'token')).rejects.toThrow('Cart is empty');

    cartApi.getCartByUserId.mockResolvedValue({ items: [{ productId: 'p1', quantity: 2, price: 50, subtotal: 100 }] });
    userApi.getProfile.mockResolvedValue({ fullName: '' }); // incomplete
    cartApi.getProductsByIds.mockResolvedValue([{ productId: 'p1', price: 50, name: 'P' }]);
    inventoryApi.checkStockBatch.mockResolvedValue([{ productId: 'p1', availableStock: 10, exists: true, isAvailable: true }]);
    inventoryApi.reserveStockBatch.mockResolvedValue({ success: true });
    cartApi.clearCart.mockResolvedValue({});
    userApi.updateProfile.mockResolvedValue({});

    const address = { fullName: 'U', phone: '1', address: 'A', city: 'C', state: 'S', pincode: '1' };
    await service.createOrder('user-123', 'test@test.com', address, 'UPI', 'token');
    expect(userApi.updateProfile).toHaveBeenCalled();
  });

  test('createOrder throws stock errors or validates coupon thresholds', async () => {
    cartApi.getCartByUserId.mockResolvedValue({ items: [{ productId: 'p1', quantity: 2 }] });
    userApi.getProfile.mockResolvedValue({ address: 'addr', fullName: 'U', phone: '1' });
    cartApi.getProductsByIds.mockResolvedValue([{ productId: 'p1', price: 50, name: 'P' }]);
    inventoryApi.checkStockBatch.mockResolvedValue([{ productId: 'p1', availableStock: 1, exists: true, isAvailable: false }]); // low stock
    await expect(service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token')).rejects.toThrow('Stock validation failed');

    // Product not found
    cartApi.getProductsByIds.mockResolvedValue([]);
    await expect(service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token')).rejects.toThrow('Stock validation failed');

    // Inventory not found
    cartApi.getProductsByIds.mockResolvedValue([{ productId: 'p1', price: 50, name: 'P' }]);
    inventoryApi.checkStockBatch.mockResolvedValue([]);
    await expect(service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token')).rejects.toThrow('Stock validation failed');

    // Inventory reservation fails
    inventoryApi.checkStockBatch.mockResolvedValue([{ productId: 'p1', availableStock: 10, exists: true, isAvailable: true }]);
    inventoryApi.reserveStockBatch.mockRejectedValue(new Error('Reservation failed'));
    await expect(service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token')).rejects.toThrow('Inventory reservation failed');

    // publishOrderCreated SNS publish fails
    inventoryApi.reserveStockBatch.mockResolvedValue({ success: true });
    cartApi.clearCart.mockResolvedValue({});
    global.docClientSendMock.mockResolvedValue({});
    global.snsSendMock.mockRejectedValueOnce(new Error('SNS publish fail'));
    const order = await service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token');
    expect(order).toBeDefined();

    // Coupon minPurchase validation throw
    couponClient.validateCoupon.mockRejectedValue(new Error('Minimum purchase amount not met'));
    await expect(service.createOrder('user-123', 'test@test.com', 'address', 'UPI', 'token', 'SAVE10')).rejects.toThrow('Minimum purchase amount');
  });

  test('getAllOrders with all query filters, sorting, and pagination statistics', async () => {
    const mockItems = [
      {
        orderid: 'o1',
        email: 'test@test.com',
        totalAmount: 100,
        createdAt: '2026-08-04T12:00:00Z',
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        customerInfo: { email: 'cust1@test.com', phone: '111', fullName: 'Cust One' },
        shippingAddress: { fullName: 'Ship One', phone: '111' }
      },
      {
        orderid: 'o2',
        email: 'other@test.com',
        totalAmount: 200,
        createdAt: '2026-08-03T12:00:00Z',
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentMethod: 'CARD',
        customerInfo: { email: 'cust2@test.com', phone: '222', fullName: 'Cust Two' }
      },
      {
        orderid: 'o3',
        totalAmount: 300,
        createdAt: '2026-08-02T12:00:00Z',
        orderStatus: 'OUT_FOR_DELIVERY',
        paymentStatus: 'PAID',
        paymentMethod: 'COD'
      },
      {
        orderid: 'o4',
        totalAmount: 400,
        createdAt: '2026-08-01T12:00:00Z',
        orderStatus: 'CANCELLED',
        paymentStatus: 'FAILED',
        paymentMethod: 'COD'
      },
      {
        orderid: 'o5',
        totalAmount: 500,
        orderStatus: 'PAYMENT_FAILED',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD'
      },
      {
        orderid: 'o6',
        totalAmount: 600,
        orderStatus: 'PENDING PAYMENT',
        paymentStatus: 'PENDING'
      },
      {
        orderid: 'o7',
        totalAmount: 700,
        orderStatus: 'OUT FOR DELIVERY',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD'
      },
      {
        orderid: 'o8',
        totalAmount: 800,
        orderStatus: 'CANCELED',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD'
      },
      {
        orderid: 'o9',
        totalAmount: 900,
        orderStatus: 'PAYMENT FAILED',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD'
      }
    ];
    global.docClientSendMock.mockResolvedValue({ Items: mockItems });

    const query = {
      search: 'cust1',
      orderStatus: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      minAmount: '50',
      maxAmount: '150',
      sort: 'priceAsc',
      page: '1',
      limit: '10'
    };

    const res = await service.getAllOrders(query);
    expect(res.data).toHaveLength(1);

    // Test different sort options, pagination boundaries, and empty searches
    await service.getAllOrders({ sort: 'oldest', page: -1, limit: -1 });
    await service.getAllOrders({ sort: 'newest', minAmount: '', maxAmount: '' });
    await service.getAllOrders({ sort: 'highestamount' });
    await service.getAllOrders({ sort: 'lowestamount' });
    await service.getAllOrders({ search: 'non-matching-term' });
    await service.getAllOrders({ search: 'o3' }); // order id match
    await service.getAllOrders({ search: 'other@test' }); // email match
    await service.getAllOrders({ search: 'Ship One' }); // shipping name match
    await service.getAllOrders({ search: '111' }); // shipping/customer phone match
  });

  test('getOrdersByUser returns sorted list', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ orderid: 'o1', createdAt: '2026-08-01' }, { orderid: 'o2', createdAt: '2026-08-02' }] });
    const orders = await service.getOrdersByUser('user-123');
    expect(orders[0].orderid).toBe('o2');
  });

  test('processPaymentEvent updates payment statuses and checks idempotency', async () => {
    // Payload validations
    await expect(service.processPaymentEvent({})).rejects.toThrow('Invalid payment event payload');
    await expect(service.processPaymentEvent({ message: {} })).rejects.toThrow('Invalid payment event payload');
    await expect(service.processPaymentEvent({ message: { orderId: 123 } })).rejects.toThrow('Invalid payment event payload');
    await expect(service.processPaymentEvent({ message: { orderId: 'o1' } })).rejects.toThrow('Missing eventId or paymentId');

    // 404
    await expect(service.processPaymentEvent({ eventType: 'PAYMENT_SUCCESS', eventId: 'ev1', message: { orderId: 'o_not_found' } })).rejects.toThrow('Order not found');

    // SUCCESS idempotency skip
    const mockOrder = { orderid: 'o1', orderStatus: 'PENDING', processedEventIds: ['ev1'], items: [] };
    global.docClientSendMock.mockResolvedValueOnce({ Item: mockOrder }); // getOrderById
    const skipRes = await service.processPaymentEvent({ eventType: 'PAYMENT_SUCCESS', eventId: 'ev1', message: { orderId: 'o1' } });
    expect(skipRes.skipped).toBe(true);

    // New event flow - PAYMENT_SUCCESS
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [] } }) // getOrderById
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', paymentStatus: 'PAID' } }); // updateOrderStatus Attributes
    const res = await service.processPaymentEvent({ eventType: 'PAYMENT_SUCCESS', eventId: 'ev_new', message: { orderId: 'o1' } });
    expect(res.paymentStatus).toBe('PAID');

    // New event flow - PAYMENT_FAILED
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', paymentStatus: 'FAILED' } });
    const resFailed = await service.processPaymentEvent({ eventType: 'PAYMENT_FAILED', eventId: 'ev_failed', message: { orderId: 'o1' } });
    expect(resFailed.paymentStatus).toBe('FAILED');

    // New event flow - PAYMENT_REFUNDED
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PROCESSING', items: [] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', paymentStatus: 'REFUNDED' } });
    const resRefunded = await service.processPaymentEvent({ eventType: 'PAYMENT_REFUNDED', eventId: 'ev_refunded', message: { orderId: 'o1' } });
    expect(resRefunded.paymentStatus).toBe('REFUNDED');

    // Unsupported event type
    global.docClientSendMock.mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PROCESSING', items: [] } });
    await expect(service.processPaymentEvent({ eventType: 'INVALID_EVENT', eventId: 'ev_invalid', message: { orderId: 'o1' } })).rejects.toThrow('Unsupported payment event type');

    // publishOrderConfirmed fails
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', paymentStatus: 'PAID' } });
    global.snsSendMock.mockRejectedValueOnce(new Error('SNS publish fail'));
    const resSnsFail = await service.processPaymentEvent({ eventType: 'PAYMENT_SUCCESS', eventId: 'ev_sns_fail', message: { orderId: 'o1' } });
    expect(resSnsFail.paymentStatus).toBe('PAID');
  });

  test('updateOrderStatus follows valid transitions and throws invalid ones', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'COMPLETED' } });
    await expect(service.updateOrderStatus('o1', 'PENDING_PAYMENT')).rejects.toThrow('Cannot update terminal order');

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT' } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'PROCESSING' } });
    const res = await service.updateOrderStatus('o1', 'PROCESSING');
    expect(res.orderStatus).toBe('PROCESSING');

    // Test invalid transition
    global.docClientSendMock.mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT' } });
    await expect(service.updateOrderStatus('o1', 'DELIVERED')).rejects.toThrow('Invalid transition');

    // Test transition states and SNS error handling
    const states = ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
    let prev = 'PROCESSING';
    for (const state of states) {
      global.docClientSendMock
        .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: prev } })
        .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: state } });
      const transitionRes = await service.updateOrderStatus('o1', state);
      expect(transitionRes.orderStatus).toBe(state);
      prev = state;
    }

    // SNS error on status update
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PROCESSING' } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'PACKED' } });
    global.snsSendMock.mockRejectedValueOnce(new Error('SNS fail'));
    const transitionResSnsFail = await service.updateOrderStatus('o1', 'PACKED');
    expect(transitionResSnsFail.orderStatus).toBe('PACKED');

    // Transition to CANCELLED (hits default break in switch block)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PROCESSING' } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'CANCELLED' } });
    const transitionCancelled = await service.updateOrderStatus('o1', 'CANCELLED');
    expect(transitionCancelled.orderStatus).toBe('CANCELLED');

    // Non-existent order
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(service.updateOrderStatus('o_none', 'PACKED')).rejects.toThrow('Order not found');

    // Transition where existing order status does not allow any transitions (falls back to [])
    global.docClientSendMock.mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'UNKNOWN_STATUS' } });
    await expect(service.updateOrderStatus('o1', 'PROCESSING')).rejects.toThrow('Invalid transition');
  });

  test('cancelOrder restores stock and cancels order', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'COMPLETED' } });
    await expect(service.cancelOrder('o1')).rejects.toThrow('Cannot cancel');

    // Non-existent order
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(service.cancelOrder('o_none')).rejects.toThrow('Order not found');

    // cancel order with no items
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'CANCELLED' } });
    const cancelNoItemsRes = await service.cancelOrder('o1');
    expect(cancelNoItemsRes.orderStatus).toBe('CANCELLED');

    // cancel processing order (calls restoreStock)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PROCESSING', items: [{ productId: 'p1', quantity: 2 }] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'CANCELLED' } });
    inventoryApi.restoreStock.mockResolvedValue({});

    const res = await service.cancelOrder('o1');
    expect(res.orderStatus).toBe('CANCELLED');
    expect(inventoryApi.restoreStock).toHaveBeenCalled();

    // cancel pending payment order (calls releaseStock)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [{ productId: 'p1', quantity: 2 }] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'CANCELLED' } });
    inventoryApi.releaseStock.mockResolvedValue({});

    const resPending = await service.cancelOrder('o1');
    expect(resPending.orderStatus).toBe('CANCELLED');
    expect(inventoryApi.releaseStock).toHaveBeenCalled();

    // cancel order - publishOrderCancelled fails
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', items: [{ productId: 'p1', quantity: 2 }] } })
      .mockResolvedValueOnce({ Attributes: { orderid: 'o1', orderStatus: 'CANCELLED' } });
    global.snsSendMock.mockRejectedValueOnce(new Error('SNS publish fail'));
    const resCancelSnsFail = await service.cancelOrder('o1');
    expect(resCancelSnsFail.orderStatus).toBe('CANCELLED');
  });

  test('generateInvoicePdf writes to PDF stream successfully', async () => {
    const order = {
      orderid: 'o1',
      createdAt: '2026-08-04',
      customerInfo: { email: 't@t.com' },
      shippingAddress: { fullName: 'U', phone: '1', line1: 'L1', city: 'C', state: 'S', postalCode: '1' },
      items: [
        { productId: 'p1', name: 'Product A', quantity: 2, price: 50, subtotal: 100 },
        { productId: 'p2', name: 'Product B', quantity: 1, price: 50, subtotal: 50 }
      ],
      totalAmount: 150
    };
    const res = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        return res;
      })
    };
    await service.generateInvoicePdf(order, res);
    expect(res.end).toHaveBeenCalled();

    // With coupon code
    order.couponCode = 'SAVE10';
    order.discountAmount = 10;
    await service.generateInvoicePdf(order, res);
    expect(res.end).toHaveBeenCalled();

    // Trigger fallbacks (no shippingAddress, no billing, no paymentMethod, no subtotal)
    const fallbackOrder = {
      orderid: 'o2',
      createdAt: '2026-08-04',
      items: [{ productId: 'p1', name: 'Product A', quantity: 2, price: 50, subtotal: 100 }],
      totalAmount: 100
    };
    await service.generateInvoicePdf(fallbackOrder, res);
    expect(res.end).toHaveBeenCalled();
  });

  test('appendProcessedEvent appends event ID successfully', async () => {
    global.docClientSendMock.mockResolvedValueOnce({});
    await service.appendProcessedEvent('o1', 'ev1');
    expect(global.docClientSendMock).toHaveBeenCalled();
  });

  test('generateInvoicePdf handles doc and res errors', async () => {
    const order = {
      orderid: 'o1',
      createdAt: '2026-08-04',
      customerInfo: { email: 't@t.com' },
      shippingAddress: { fullName: 'U', phone: '1', line1: 'L1', city: 'C', state: 'S', postalCode: '1' },
      items: [{ productId: 'p1', name: 'Product A', quantity: 2, price: 50, subtotal: 100 }],
      totalAmount: 100
    };

    // 1. doc error
    const res = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        return res;
      })
    };

    const promise = service.generateInvoicePdf(order, res);
    
    // Trigger error on the mock PDFDocument instance
    const PDFDocument = require('pdfkit');
    const docInstance = PDFDocument.mock.results[PDFDocument.mock.results.length - 1].value;
    docInstance.listeners['error'](new Error('PDF doc error'));

    await expect(promise).rejects.toThrow('PDF doc error');

    // 2. res error
    let resErrListener;
    const resWithErr = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'error') resErrListener = cb;
        return resWithErr;
      })
    };

    const promiseResErr = service.generateInvoicePdf(order, resWithErr);
    resErrListener(new Error('Res stream error'));

    await expect(promiseResErr).rejects.toThrow('Res stream error');
  });
});
