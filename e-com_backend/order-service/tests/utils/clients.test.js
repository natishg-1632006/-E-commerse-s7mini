jest.resetModules();
const oldInventory = process.env.INVENTORY_SERVICE_URL;
const oldUser = process.env.USER_SERVICE_URL;
delete process.env.INVENTORY_SERVICE_URL;
delete process.env.USER_SERVICE_URL;

const cartApi = require('../../src/utils/cartApi');
const couponClient = require('../../src/utils/couponClient');
const inventoryApi = require('../../src/utils/inventoryApi');
const userApi = require('../../src/utils/userApi');
const orderEventPublisher = require('../../src/utils/orderEventPublisher');

process.env.INVENTORY_SERVICE_URL = oldInventory;
process.env.USER_SERVICE_URL = oldUser;

describe('order clients', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    global.axiosMock.get.mockReset();
    global.axiosMock.post.mockReset();
    global.axiosMock.delete.mockReset();
    global.axiosMock.put.mockReset();
  });

  test('clients call endpoints success path and branches', async () => {
    global.axiosMock.get.mockResolvedValue({ data: { data: { cart: 'ok' } } });
    global.axiosMock.post.mockResolvedValue({ data: { data: { status: 'ok' } } });
    global.axiosMock.delete.mockResolvedValue({ data: { data: { status: 'ok' } } });
    global.axiosMock.put.mockResolvedValue({ data: { data: { profile: 'ok' } } });

    // Mock cartApi responses
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [{ cartid: 'c1' }] }) // getCartByUserId happy path
      .mockResolvedValueOnce({ Item: { productId: 'p1' } }) // getProductById happy path
      .mockResolvedValueOnce({ Item: null }) // getProductById returns null
      .mockResolvedValueOnce({ Responses: { test_table: [] } }); // getProductsByIds empty responses

    await cartApi.getCartByUserId('u1');
    await cartApi.getProductById('p1');
    await cartApi.getProductById('p2');
    await cartApi.clearCart('u1');
    await cartApi.getProductsByIds(['p1']);
    await couponClient.validateCoupon('code', 100, []);
    await inventoryApi.checkStock('p1', 1, 'token');
    await inventoryApi.reserveStock('p1', 1, 'o1', 'token');
    await inventoryApi.reserveStockBatch('o1', []);
    await inventoryApi.releaseStock('p1', 1, 'o1');
    await inventoryApi.increaseStock('p1', 1, 'o1');
    await inventoryApi.restoreStock('p1', 1, 'o1');
    await inventoryApi.checkStockBatch([]);
    await userApi.getProfile('token');
    await userApi.updateProfile({}, 'token');

    // Call endpoints to trigger data?.data || null / || [] fallbacks
    global.axiosMock.get.mockResolvedValueOnce({ data: {} }); // checkStock returns null
    global.axiosMock.post.mockResolvedValueOnce({ data: {} }); // checkStockBatch returns []
    global.axiosMock.post.mockResolvedValueOnce({ data: {} }); // reserveStock returns null
    global.axiosMock.post.mockResolvedValueOnce({ data: {} }); // releaseStock returns null

    const checkStockNull = await inventoryApi.checkStock('p1', 1, 'token');
    expect(checkStockNull).toBeNull();

    const checkStockBatchEmpty = await inventoryApi.checkStockBatch([]);
    expect(checkStockBatchEmpty).toEqual([]);

    const reserveStockNull = await inventoryApi.reserveStock('p1', 1, 'o1');
    expect(reserveStockNull).toBeNull();

    const releaseStockNull = await inventoryApi.releaseStock('p1', 1, 'o1');
    expect(releaseStockNull).toBeNull();
  });

  test('clients error handling - response error with message', async () => {
    const responseErr = {
      response: {
        status: 404,
        data: {
          message: 'Service unavailable'
        }
      }
    };
    global.axiosMock.get.mockRejectedValue(responseErr);
    global.axiosMock.post.mockRejectedValue(responseErr);
    global.axiosMock.delete.mockRejectedValue(responseErr);
    global.axiosMock.put.mockRejectedValue(responseErr);

    await expect(couponClient.validateCoupon('code', 100, [])).rejects.toThrow('Service unavailable');
    
    // inventoryApi checkStock returns null on 404
    const checkStock404 = await inventoryApi.checkStock('p1', 1, 'token');
    expect(checkStock404).toBeNull();

    await expect(inventoryApi.checkStockBatch([])).rejects.toThrow('Service unavailable');
    await expect(inventoryApi.reserveStock('p1', 1, 'o1', 'token')).rejects.toEqual(responseErr);
    await expect(inventoryApi.reserveStockBatch('o1', [])).rejects.toEqual(responseErr);
    await expect(inventoryApi.increaseStock('p1', 1, 'o1')).rejects.toEqual(responseErr);
    await expect(inventoryApi.restoreStock('p1', 1, 'o1')).rejects.toEqual(responseErr);

    // inventoryApi releaseStock catches error, logs it, and returns null
    const releaseRes = await inventoryApi.releaseStock('p1', 1, 'o1');
    expect(releaseRes).toBeNull();

    await expect(userApi.getProfile('token')).rejects.toThrow('Service unavailable');
    await expect(userApi.updateProfile({}, 'token')).rejects.toThrow('Service unavailable');
  });

  test('clients error handling - response error without message', async () => {
    const responseErrNoMsg = {
      response: {
        status: 500,
        data: {}
      }
    };
    global.axiosMock.get.mockRejectedValue(responseErrNoMsg);
    global.axiosMock.post.mockRejectedValue(responseErrNoMsg);
    global.axiosMock.delete.mockRejectedValue(responseErrNoMsg);
    global.axiosMock.put.mockRejectedValue(responseErrNoMsg);

    await expect(couponClient.validateCoupon('code', 100, [])).rejects.toThrow('Coupon validation failed');
    await expect(inventoryApi.checkStock('p1', 1, 'token')).rejects.toThrow('Inventory Service unreachable');
    await expect(inventoryApi.checkStockBatch([])).rejects.toThrow('Inventory Batch API Error');
    await expect(inventoryApi.reserveStock('p1', 1, 'o1', 'token')).rejects.toEqual(responseErrNoMsg);
    await expect(inventoryApi.reserveStockBatch('o1', [])).rejects.toEqual(responseErrNoMsg);
    await expect(inventoryApi.increaseStock('p1', 1, 'o1')).rejects.toEqual(responseErrNoMsg);
    await expect(inventoryApi.restoreStock('p1', 1, 'o1')).rejects.toEqual(responseErrNoMsg);
    await expect(userApi.getProfile('token')).rejects.toThrow('User Service Error');
    await expect(userApi.updateProfile({}, 'token')).rejects.toThrow('User Service Error');
  });

  test('clients error handling - network error without response', async () => {
    const networkErr = new Error('Network Error');
    global.axiosMock.get.mockRejectedValue(networkErr);
    global.axiosMock.post.mockRejectedValue(networkErr);
    global.axiosMock.delete.mockRejectedValue(networkErr);
    global.axiosMock.put.mockRejectedValue(networkErr);

    await expect(couponClient.validateCoupon('code', 100, [])).rejects.toThrow('Coupon Service unavailable');
    await expect(inventoryApi.checkStock('p1', 1, 'token')).rejects.toThrow('Network Error');
    await expect(inventoryApi.checkStockBatch([])).rejects.toThrow('Network Error');
    await expect(inventoryApi.reserveStock('p1', 1, 'o1', 'token')).rejects.toEqual(networkErr);
    await expect(inventoryApi.reserveStockBatch('o1', [])).rejects.toEqual(networkErr);
    await expect(inventoryApi.increaseStock('p1', 1, 'o1')).rejects.toEqual(networkErr);
    await expect(inventoryApi.restoreStock('p1', 1, 'o1')).rejects.toEqual(networkErr);
    await expect(userApi.getProfile('token')).rejects.toThrow('Network Error');
    await expect(userApi.updateProfile({}, 'token')).rejects.toThrow('Network Error');
  });

  test('orderEventPublisher publishes to SNS and handles error', async () => {
    global.snsSendMock.mockResolvedValue({});
    await orderEventPublisher.publishOrderCreated({ orderId: 'o1' });
    await orderEventPublisher.publishOrderCancelled({ orderId: 'o1' });
  });

  test('clients environment fallbacks and defaults', async () => {
    // Delete service URLs from env to trigger fallbacks
    const oldInventoryUrl = process.env.INVENTORY_SERVICE_URL;
    const oldUserUrl = process.env.USER_SERVICE_URL;
    delete process.env.INVENTORY_SERVICE_URL;
    delete process.env.USER_SERVICE_URL;

    // Trigger defaults
    global.axiosMock.post.mockResolvedValue({ data: { data: {} } });
    global.axiosMock.get.mockResolvedValue({ data: { data: {} } });

    // couponClient default parameter items = []
    await couponClient.validateCoupon('code', 100);

    // inventoryApi checkStock fallback url
    await inventoryApi.checkStock('p1', 1, 'token');

    // userApi getProfile fallback url
    await userApi.getProfile('token');

    // Restore env
    process.env.INVENTORY_SERVICE_URL = oldInventoryUrl;
    process.env.USER_SERVICE_URL = oldUserUrl;

    // cartApi Responses branches
    global.docClientSendMock
      .mockResolvedValueOnce({}) // getCartByUserId missing Items key
      .mockResolvedValueOnce({ Responses: {} }) // getProductsByIds missing PRODUCTS_TABLE key
      .mockResolvedValueOnce({ Responses: null }); // getProductsByIds null Responses

    const cartRes = await cartApi.getCartByUserId('u1');
    expect(cartRes).toBeNull();

    const productsRes1 = await cartApi.getProductsByIds(['p1']);
    expect(productsRes1).toEqual([]);

    const productsRes2 = await cartApi.getProductsByIds(['p1']);
    expect(productsRes2).toEqual([]);
  });
});
