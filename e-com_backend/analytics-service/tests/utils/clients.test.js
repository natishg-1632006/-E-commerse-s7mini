const { createClient } = require('../../src/clients/apiClient');
const orderClient = require('../../src/clients/orderClient');
const productClient = require('../../src/clients/productClient');
const categoryClient = require('../../src/clients/categoryClient');
const inventoryClient = require('../../src/clients/inventoryClient');
const couponClient = require('../../src/clients/couponClient');
const paymentClient = require('../../src/clients/paymentClient');

describe('clients testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('apiClient creates axios instance with retries and errors', async () => {
    let capturedFulfilled, capturedRejected;
    const axios = require('axios');
    const client = axios.create();
    client.interceptors.response.use = jest.fn().mockImplementation((fulfilled, rejected) => {
      capturedFulfilled = fulfilled;
      capturedRejected = rejected;
    });

    createClient('http://test-service');

    // Success path
    const res = capturedFulfilled({ data: 'ok' });
    expect(res.data).toBe('ok');

    // Reject no config
    await expect(capturedRejected(new Error('fail'))).rejects.toThrow('fail');

    // Reject non-transient error
    await expect(capturedRejected({
      config: { url: '/test' },
      response: { status: 400, data: { message: 'Bad request' } }
    })).rejects.toThrow('Bad request');

    // Reject transient retry exhaust
    await expect(capturedRejected({
      config: { url: '/test', __retryCount: 3 },
      response: { status: 500 }
    })).rejects.toThrow('Downstream microservice error');
  });

  test('downstream clients call endpoints', async () => {
    global.axiosMock.get.mockResolvedValue({ data: [] });
    global.axiosMock.post.mockResolvedValue({ data: {} });

    await orderClient.getAllOrders('token');
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await productClient.getAllProducts('token');
    await productClient.checkHealth();
    expect(global.axiosMock.get).toHaveBeenCalled();
  });

  test('categoryClient functions call endpoints', async () => {
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await categoryClient.getAllCategories('token');
    await categoryClient.checkHealth();
    expect(global.axiosMock.get).toHaveBeenCalled();
  });

  test('inventoryClient functions call endpoints', async () => {
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await inventoryClient.getAllInventory('token');
    await inventoryClient.checkHealth();
    expect(global.axiosMock.get).toHaveBeenCalled();
  });

  test('couponClient functions call endpoints', async () => {
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await couponClient.getAllCoupons('token');
    await couponClient.checkHealth();
    expect(global.axiosMock.get).toHaveBeenCalled();
  });

  test('paymentClient functions call endpoints', async () => {
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await paymentClient.getAllPayments('token');
    await paymentClient.checkHealth();
    expect(global.axiosMock.get).toHaveBeenCalled();
  });
});
