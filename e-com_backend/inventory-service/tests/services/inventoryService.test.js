const service = require('../../src/services/inventoryService');
const productApi = require('../../src/utils/productApi');

jest.mock('../../src/utils/productApi');

describe('inventoryService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('createInventory success and error paths', async () => {
    productApi.getProduct.mockResolvedValue({ productId: 'p1' });
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: null }) // check duplicate
      .mockResolvedValueOnce({}); // put
    
    const res = await service.createInventory({ productId: 'p1', currentStock: 10 });
    expect(res.productId).toBe('p1');

    // Product not found
    productApi.getProduct.mockResolvedValue(null);
    await expect(service.createInventory({ productId: 'p1' })).rejects.toThrow('Product not found');

    // Already exists
    productApi.getProduct.mockResolvedValue({ productId: 'p1' });
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1' } });
    await expect(service.createInventory({ productId: 'p1' })).rejects.toThrow('already exists');
  });

  test('processProductCreatedEvent and processProductDeletedEvent', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: null }); // check existing
    await service.processProductCreatedEvent({ message: { productId: 'p1', name: 'P' } });

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1' } }) // getExisting
      .mockResolvedValueOnce({}); // delete
    await service.processProductDeletedEvent({ message: { productId: 'p1' } });
  });

  test('updateInventory success', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', availableStock: 10 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1' } });
    const res = await service.updateInventory('p1', { lowStockThreshold: 5 });
    expect(res).toBeDefined();
  });

  test('increaseStock and decreaseStock', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, lowStockThreshold: 5 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', currentStock: 15 } });
    const resInc = await service.increaseStock('p1', 5, 'restock');
    expect(resInc.currentStock).toBe(15);

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, lowStockThreshold: 5 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', currentStock: 5 } });
    const resDec = await service.decreaseStock('p1', 5, 'sale');
    expect(resDec.currentStock).toBe(5);

    // Insufficient stock throw
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 5, reservedStock: 2 } });
    await expect(service.decreaseStock('p1', 10)).rejects.toThrow('Insufficient stock');
  });

  test('reserveStock and releaseStock', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, lowStockThreshold: 5, availableStock: 8 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', reservedStock: 7 } });
    const res = await service.reserveStock('p1', 5, 'ref');
    expect(res.reservedStock).toBe(7);

    // Insufficient to reserve
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 8, availableStock: 2 } });
    await expect(service.reserveStock('p1', 5)).rejects.toThrow('Insufficient available stock');

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 5, availableStock: 5 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', reservedStock: 3 } });
    const resRel = await service.releaseStock('p1', 2, 'ref');
    expect(resRel.reservedStock).toBe(3);
  });

  test('reserveStockBatch', async () => {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'test-table';
    global.docClientSendMock
      .mockResolvedValueOnce({ Responses: { [tableName]: [{ productId: 'p1', currentStock: 10, reservedStock: 2, availableStock: 8 }] } })
      .mockResolvedValueOnce({});
    const res = await service.reserveStockBatch('o1', [{ productId: 'p1', quantity: 2 }]);
    expect(res.success).toBe(true);
  });

  test('checkStockAvailability and checkStockAvailabilityBatch', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, availableStock: 8 } });
    const res1 = await service.checkStockAvailability('p1', 2);
    expect(res1.isAvailable).toBe(true);

    const tableName = process.env.DYNAMODB_TABLE_NAME || 'test-table';
    global.docClientSendMock.mockResolvedValueOnce({ Responses: { [tableName]: [{ productId: 'p1', currentStock: 10, reservedStock: 2, availableStock: 8 }] } });
    const res2 = await service.checkStockAvailabilityBatch([{ productId: 'p1', quantity: 2 }]);
    expect(res2[0].isAvailable).toBe(true);
  });

  test('reduceStock and restoreStock', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, lowStockThreshold: 5, availableStock: 8 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', currentStock: 8, lastUpdated: 'now' } });
    const resRed = await service.reduceStock('p1', 2);
    expect(resRed.currentStock).toBe(8);

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, soldQuantity: 5 } })
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', currentStock: 12, lastUpdated: 'now' } });
    const resRest = await service.restoreStock('p1', 2, 'o1');
    expect(resRest.currentStock).toBe(12);
  });

  test('processPaymentEvent handles events', async () => {
    // PAYMENT_SUCCESS
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { orderid: 'o1', processedEventIds: [] } }) // getOrder
      .mockResolvedValueOnce({ Item: { productId: 'p1', currentStock: 10, reservedStock: 2, availableStock: 8 } }) // getInventory
      .mockResolvedValueOnce({ Attributes: { productId: 'p1', currentStock: 8, lastUpdated: 'now' } }); // update stock
    await service.processPaymentEvent({ eventType: 'PAYMENT_SUCCESS', eventId: 'ev1', message: { orderId: 'o1', items: [{ productId: 'p1', quantity: 2 }] } });
  });

  test('getAllInventory and getLowStockProducts', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ productId: 'p1' }] });
    const list = await service.getAllInventory();
    expect(list).toHaveLength(1);

    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ productId: 'p1' }] });
    const low = await service.getLowStockProducts();
    expect(low).toHaveLength(1);
  });
});
