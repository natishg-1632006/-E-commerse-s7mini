const service = require('../../src/services/analyticsService');
const orderClient = require('../../src/clients/orderClient');
const productClient = require('../../src/clients/productClient');
const categoryClient = require('../../src/clients/categoryClient');
const inventoryClient = require('../../src/clients/inventoryClient');
const couponClient = require('../../src/clients/couponClient');
const paymentClient = require('../../src/clients/paymentClient');

jest.mock('../../src/clients/orderClient');
jest.mock('../../src/clients/productClient');
jest.mock('../../src/clients/categoryClient');
jest.mock('../../src/clients/inventoryClient');
jest.mock('../../src/clients/couponClient');
jest.mock('../../src/clients/paymentClient');

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboardData aggregates KPIs successfully and handles client errors', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { orderStatus: 'COMPLETED', paymentStatus: 'PAID', totalAmount: 100, paymentMethod: 'UPI' },
      { orderStatus: 'CANCELLED', paymentStatus: 'PENDING', totalAmount: 50, paymentMethod: 'CARD' },
      { orderStatus: 'PENDING', paymentStatus: 'PENDING', totalAmount: 20, paymentMethod: 'COD' }
    ] });
    productClient.getAllProducts.mockResolvedValue([{ productId: 'p1' }]);
    categoryClient.getAllCategories.mockResolvedValue([{ id: 'c1', name: 'Cat 1' }]);
    inventoryClient.getAllInventory.mockResolvedValue([{ productId: 'p1', currentStock: 20, reservedStock: 2 }]);
    couponClient.getAllCoupons.mockResolvedValue([{ code: 'COUPON' }]);
    paymentClient.getAllPayments.mockResolvedValue([{ paymentMethod: 'UPI', amount: 100, status: 'PAID' }]);

    const data = await service.getDashboardData('token');
    expect(data.revenue).toBe(100);
    expect(data.orders).toBe(3);

    // Test client failures
    orderClient.getAllOrders.mockRejectedValue(new Error('fail'));
    productClient.getAllProducts.mockRejectedValue(new Error('fail'));
    categoryClient.getAllCategories.mockRejectedValue(new Error('fail'));
    inventoryClient.getAllInventory.mockRejectedValue(new Error('fail'));
    couponClient.getAllCoupons.mockRejectedValue(new Error('fail'));
    paymentClient.getAllPayments.mockRejectedValue(new Error('fail'));

    const dataFail = await service.getDashboardData('token');
    expect(dataFail.revenue).toBe(0);
  });

  test('getRevenueAnalytics tracks revenue timeline with different periods', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { createdAt: new Date().toISOString(), paymentStatus: 'PAID', totalAmount: 100 },
      { createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), paymentStatus: 'PAID', totalAmount: 50 }
    ] });

    await service.getRevenueAnalytics('token', 'yesterday');
    await service.getRevenueAnalytics('token', 'last7days');
    await service.getRevenueAnalytics('token', 'last30days');
    await service.getRevenueAnalytics('token', 'month');
    await service.getRevenueAnalytics('token', 'year');
    await service.getRevenueAnalytics('token', 'custom', '2026-08-01', '2026-08-05');
    await service.getRevenueAnalytics('token', 'invalid_period'); // triggers default
    const res = await service.getRevenueAnalytics('token', 'today');
    expect(res).toBeDefined();
  });

  test('getOrderAnalytics aggregates statuses and trends', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { orderStatus: 'DELIVERED', paymentStatus: 'PAID', totalAmount: 80, createdAt: '2026-08-04T10:00:00Z' },
      { orderStatus: 'CANCELLED', paymentStatus: 'FAILED', totalAmount: 50, createdAt: '2026-08-04T11:00:00Z' },
      { orderStatus: 'PAYMENT_FAILED', paymentStatus: 'FAILED', totalAmount: 30, createdAt: '2026-08-04T12:00:00Z' },
      { orderStatus: 'PROCESSING', paymentStatus: 'PENDING', totalAmount: 40, createdAt: '2026-08-04T13:00:00Z' }
    ] });
    const data = await service.getOrderAnalytics('token');
    expect(data.completed).toBe(1);
    expect(data.cancelled).toBe(2);
    expect(data.pending).toBe(1);
    expect(data.revenue).toBe(80);
  });

  test('getProductAnalytics identifies selling items', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { paymentStatus: 'PAID', items: [{ productId: 'p1', quantity: 5, subtotal: 100 }, { productId: 'p2', quantity: 2, subtotal: 50 }] }
    ] });
    productClient.getAllProducts.mockResolvedValue([
      { productId: 'p1', name: 'Item 1', brand: 'B1' },
      { productId: 'p2', name: 'Item 2', brand: 'B2' },
      { productId: 'p3', name: 'Unsold Item', brand: 'B3' }
    ]);
    inventoryClient.getAllInventory.mockResolvedValue([
      { productId: 'p1', currentStock: 10 },
      { productId: 'p2', currentStock: 15 },
      { productId: 'p3', currentStock: 20 }
    ]);
    const data = await service.getProductAnalytics('token');
    expect(data.topSellingProducts.length).toBeGreaterThan(0);
  });

  test('getCategoryAnalytics groups category sales', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { paymentStatus: 'PAID', items: [{ categoryId: 'cat1', subtotal: 30, quantity: 1 }] }
    ] });
    categoryClient.getAllCategories.mockResolvedValue([
      { id: 'cat1', name: 'Category 1' },
      { id: 'cat2', name: 'Category 2' }
    ]);
    const data = await service.getCategoryAnalytics('token');
    expect(data.revenuePerCategory.length).toBeGreaterThan(0);
  });

  test('getCouponAnalytics Redemptions', async () => {
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { couponCode: 'DISCOUNT', discountAmount: 10, paymentStatus: 'PAID', orderStatus: 'COMPLETED' },
      { couponCode: 'FAILCOUPON', discountAmount: 5, paymentStatus: 'FAILED', orderStatus: 'CANCELLED' }
    ] });
    couponClient.getAllCoupons.mockResolvedValue([
      { code: 'DISCOUNT' },
      { code: 'FAILCOUPON' },
      { code: 'UNUSED' }
    ]);
    const data = await service.getCouponAnalytics('token');
    expect(data.discountGiven).toBe(15);
  });

  test('getInventoryAnalytics summarizes stock', async () => {
    inventoryClient.getAllInventory.mockResolvedValue([
      { productId: 'p1', currentStock: 100, reservedStock: 10, soldQuantity: 5, lowStockThreshold: 15 },
      { productId: 'p2', currentStock: 2, reservedStock: 2, soldQuantity: 1, lowStockThreshold: 5 }, // out of stock (available=0)
      { productId: 'p3', currentStock: 8, reservedStock: 2, soldQuantity: 2, lowStockThreshold: 10 }  // low stock (available=6 <= 10)
    ]);
    const data = await service.getInventoryAnalytics('token');
    expect(data.currentStock).toBe(110);
    expect(data.outOfStock).toBe(1);
    expect(data.lowStock).toBe(1);
  });

  test('getPaymentAnalytics UPI/Cards split and fallback', async () => {
    paymentClient.getAllPayments.mockResolvedValue([
      { paymentMethod: 'UPI', amount: 150, status: 'SUCCESS' },
      { paymentMethod: 'CARD', amount: 100, status: 'FAILED' },
      { paymentMethod: 'COD', amount: 50, status: 'PENDING' },
      { paymentMethod: 'WALLET', amount: 20, status: 'SUCCESS' }
    ]);
    const data1 = await service.getPaymentAnalytics('token');
    expect(data1.paymentMethods.UPI.amount).toBe(150);
    expect(data1.paymentMethods.Card.amount).toBe(100);

    // Fallback path
    paymentClient.getAllPayments.mockRejectedValue(new Error('Payment client error'));
    orderClient.getAllOrders.mockResolvedValue({ data: [
      { paymentMethod: 'UPI', totalAmount: 150, paymentStatus: 'PAID' },
      { paymentMethod: 'CARD', totalAmount: 100, paymentStatus: 'FAILED' },
      { paymentMethod: 'COD', totalAmount: 50, paymentStatus: 'PENDING' },
      { paymentMethod: 'WALLET', totalAmount: 20, paymentStatus: 'PAID' }
    ] });
    const data2 = await service.getPaymentAnalytics('token');
    expect(data2.paymentMethods.UPI.amount).toBe(150);
  });

  test('getHealthStatus checks downstream services', async () => {
    orderClient.checkHealth.mockResolvedValue({ status: 'Healthy' });
    productClient.checkHealth.mockResolvedValue({ status: 'Healthy' });
    categoryClient.checkHealth.mockResolvedValue({ status: 'Healthy' });
    inventoryClient.checkHealth.mockResolvedValue({ status: 'Healthy' });
    paymentClient.checkHealth.mockResolvedValue({ status: 'Healthy' });
    couponClient.checkHealth.mockResolvedValue({ status: 'Healthy' });

    const data1 = await service.getHealthStatus();
    expect(data1.status).toBe('Healthy');

    // Make one fail to test degraded state
    orderClient.checkHealth.mockResolvedValue({ status: 'Degraded' });
    const data2 = await service.getHealthStatus();
    expect(data2.status).toBe('Degraded');
  });
});
