const controller = require('../../src/controllers/inventoryController');
const service = require('../../src/services/inventoryService');

jest.mock('../../src/services/inventoryService');

describe('inventoryController', () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      headers: { authorization: 'Bearer token' }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('createInventory success and error', async () => {
    service.createInventory.mockResolvedValue({});
    await controller.createInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.createInventory.mockRejectedValue(err);
    await controller.createInventory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getAllInventory success and error', async () => {
    service.getAllInventory.mockResolvedValue([]);
    await controller.getAllInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getAllInventory.mockRejectedValue(err);
    await controller.getAllInventory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getInventoryByProductId success, 404, and error', async () => {
    req.params.productId = 'p1';
    service.getInventoryByProductId.mockResolvedValue({ productId: 'p1' });
    await controller.getInventoryByProductId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.getInventoryByProductId.mockResolvedValue(null);
    await controller.getInventoryByProductId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.getInventoryByProductId.mockRejectedValue(err);
    await controller.getInventoryByProductId(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updateInventory success, 404, and error', async () => {
    req.params.productId = 'p1';
    service.updateInventory.mockResolvedValue({ productId: 'p1' });
    await controller.updateInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.updateInventory.mockResolvedValue(null);
    await controller.updateInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.updateInventory.mockRejectedValue(err);
    await controller.updateInventory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('deleteInventory success, 404, and error', async () => {
    req.params.productId = 'p1';
    service.deleteInventory.mockResolvedValue({ productId: 'p1' });
    await controller.deleteInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.deleteInventory.mockResolvedValue(null);
    await controller.deleteInventory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    const err = new Error('fail');
    service.deleteInventory.mockRejectedValue(err);
    await controller.deleteInventory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('increaseStock and decreaseStock success and error', async () => {
    req.body = { productId: 'p1', quantity: 5, reason: 'restock' };
    service.increaseStock.mockResolvedValue({});
    await controller.increaseStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.increaseStock.mockRejectedValue(err);
    await controller.increaseStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    service.decreaseStock.mockResolvedValue({});
    await controller.decreaseStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.decreaseStock.mockRejectedValue(err);
    await controller.decreaseStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('reserveStock, reserveStockBatch, releaseStock success and error', async () => {
    req.body = { productId: 'p1', quantity: 5, referenceId: 'ref' };
    service.reserveStock.mockResolvedValue({});
    await controller.reserveStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.reserveStock.mockRejectedValue(err);
    await controller.reserveStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    req.body = { orderId: 'o1', items: [{ productId: 'p1', quantity: 2 }] };
    service.reserveStockBatch.mockResolvedValue({});
    await controller.reserveStockBatch(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.reserveStockBatch.mockRejectedValue(err);
    await controller.reserveStockBatch(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    req.body = { productId: 'p1', quantity: 5, referenceId: 'ref' };
    service.releaseStock.mockResolvedValue({});
    await controller.releaseStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.releaseStock.mockRejectedValue(err);
    await controller.releaseStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('checkStockAvailability and checkStockAvailabilityBatch success and error', async () => {
    req.params.productId = 'p1';
    req.query.quantity = '2';
    service.checkStockAvailability.mockResolvedValue({});
    await controller.checkStockAvailability(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.checkStockAvailability.mockRejectedValue(err);
    await controller.checkStockAvailability(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    req.body = { items: [{ productId: 'p1', quantity: 2 }] };
    service.checkStockAvailabilityBatch.mockResolvedValue({});
    await controller.checkStockAvailabilityBatch(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.checkStockAvailabilityBatch.mockRejectedValue(err);
    await controller.checkStockAvailabilityBatch(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('reduceStock, restoreStock, getLowStockProducts success and error', async () => {
    req.body = { productId: 'p1', quantity: 2, referenceId: 'ref' };
    service.reduceStock.mockResolvedValue({ productId: 'p1', previousStock: 10, currentStock: 8, availableStock: 8 });
    await controller.reduceStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.reduceStock.mockRejectedValue(err);
    await controller.reduceStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    req.body = { productId: 'p1', quantity: 2, orderId: 'o1' };
    service.restoreStock.mockResolvedValue({});
    await controller.restoreStock(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.restoreStock.mockRejectedValue(err);
    await controller.restoreStock(req, res, next);
    expect(next).toHaveBeenCalledWith(err);

    service.getLowStockProducts.mockResolvedValue([]);
    await controller.getLowStockProducts(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getLowStockProducts.mockRejectedValue(err);
    await controller.getLowStockProducts(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
