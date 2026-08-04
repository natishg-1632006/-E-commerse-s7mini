const { expirePendingOrders } = require('../../src/services/orderExpirationService');
const inventoryApi = require('../../src/utils/inventoryApi');

jest.mock('../../src/utils/inventoryApi');

describe('orderExpirationService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('expirePendingOrders expires pending timeout orders and releases stock', async () => {
    const expiredOrder = { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', expiresAt: '2026-08-01', items: [{ productId: 'p1', quantity: 2 }] };
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [expiredOrder] }) // scan pending
      .mockResolvedValueOnce({ Attributes: { orderStatus: 'EXPIRED' } }); // updateOrderStatus Attributes
    
    inventoryApi.releaseStock.mockResolvedValue({});

    const res = await expirePendingOrders();
    expect(res.expired).toBe(1);
    expect(inventoryApi.releaseStock).toHaveBeenCalled();
  });

  test('expirePendingOrders returns 0 if no expired orders', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [] });
    const res = await expirePendingOrders();
    expect(res.expired).toBe(0);

    // Scan response missing Items key entirely
    global.docClientSendMock.mockResolvedValueOnce({});
    const resNoItemsKey = await expirePendingOrders();
    expect(resNoItemsKey.expired).toBe(0);
  });

  test('expirePendingOrders handles stock release failure and update failures', async () => {
    const expiredOrder = { orderid: 'o1', orderStatus: 'PENDING_PAYMENT', expiresAt: '2026-08-01', items: [{ productId: 'p1', quantity: 2 }] };
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [expiredOrder] })
      .mockRejectedValueOnce(new Error('Update failed'));

    inventoryApi.releaseStock.mockRejectedValueOnce(new Error('Release failed'));

    const res = await expirePendingOrders();
    expect(res.expired).toBe(0);
    expect(res.failed).toBe(1);
  });

  test('expirePendingOrders handles orders with empty items array or missing items field', async () => {
    const orderEmptyItems = { orderid: 'o2', orderStatus: 'PENDING_PAYMENT', expiresAt: '2026-08-01', items: [] };
    const orderNoItems = { orderid: 'o3', orderStatus: 'PENDING_PAYMENT', expiresAt: '2026-08-01' };

    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [orderEmptyItems, orderNoItems] })
      .mockResolvedValueOnce({ Attributes: { orderStatus: 'EXPIRED' } })
      .mockResolvedValueOnce({ Attributes: { orderStatus: 'EXPIRED' } });

    const res = await expirePendingOrders();
    expect(res.expired).toBe(2);
  });
});
