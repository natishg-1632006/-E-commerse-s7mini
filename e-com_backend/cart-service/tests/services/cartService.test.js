const service = require('../../src/services/cartService');
const productApi = require('../../src/utils/productApi');

jest.mock('../../src/utils/productApi');

describe('cartService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('getCart returns item or null', async () => {
    global.docClientSendMock.mockResolvedValue({ Items: [] });
    const cart = await service.getCart('user-123');
    expect(cart).toBeNull();
  });

  test('addToCart creates new cart or adds to existing item', async () => {
    productApi.getProductById.mockResolvedValue({ productId: 'p1', name: 'Product 1', price: 10, stock: 5 });
    
    // Missing cart flow
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [] }) // getCart returns null
      .mockResolvedValueOnce({}); // PutCommand succeeds
    const cart1 = await service.addToCart('user-123', 'p1', 2);
    expect(cart1.totalAmount).toBe(20);

    // Existing item flow
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [{ productId: 'p1', quantity: 1, price: 10, subtotal: 10 }], totalAmount: 10 }] })
      .mockResolvedValueOnce({});
    const cart2 = await service.addToCart('user-123', 'p1', 2);
    expect(cart2.items[0].quantity).toBe(3);
  });

  test('addToCart throws 404/400 errors', async () => {
    productApi.getProductById.mockResolvedValue(null);
    await expect(service.addToCart('user-123', 'p1', 1)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    productApi.getProductById.mockResolvedValue({ productId: 'p1', stock: 1 });
    await expect(service.addToCart('user-123', 'p1', 2)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  test('updateQuantity updates item amount and throws errors', async () => {
    productApi.getProductById.mockResolvedValue({ productId: 'p1', name: 'Product 1', price: 10, stock: 5 });
    
    // Normal flow
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [{ productId: 'p1', quantity: 1, price: 10 }], totalAmount: 10 }] })
      .mockResolvedValueOnce({});
    const cart = await service.updateQuantity('user-123', 'p1', 3);
    expect(cart.items[0].quantity).toBe(3);

    // Cart not found
    global.docClientSendMock.mockResolvedValueOnce({ Items: [] });
    await expect(service.updateQuantity('user-123', 'p1', 1)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    // Item not found in cart
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [] }] });
    await expect(service.updateQuantity('user-123', 'p1', 1)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    // Product not found in productApi
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [{ productId: 'p1' }] }] });
    productApi.getProductById.mockResolvedValueOnce(null);
    await expect(service.updateQuantity('user-123', 'p1', 1)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    // Insufficient stock
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [{ productId: 'p1' }] }] });
    productApi.getProductById.mockResolvedValueOnce({ productId: 'p1', stock: 1 });
    await expect(service.updateQuantity('user-123', 'p1', 2)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  test('removeItem deletes item and throws errors', async () => {
    // Normal flow
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [{ productId: 'p1', price: 10, quantity: 1, subtotal: 10 }], totalAmount: 10 }] })
      .mockResolvedValueOnce({});
    const cart = await service.removeItem('user-123', 'p1');
    expect(cart.items.length).toBe(0);

    // Cart not found
    global.docClientSendMock.mockResolvedValueOnce({ Items: [] });
    await expect(service.removeItem('user-123', 'p1')).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    // Item not found in cart
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123', items: [] }] });
    await expect(service.removeItem('user-123', 'p1')).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });

  test('clearCart deletes entire cart and throws errors', async () => {
    // Normal flow
    global.docClientSendMock
      .mockResolvedValueOnce({ Items: [{ cartid: 'c1', userId: 'user-123' }] })
      .mockResolvedValueOnce({});
    const res = await service.clearCart('user-123');
    expect(res.message).toBe('Cart cleared successfully');

    // Cart not found
    global.docClientSendMock.mockResolvedValueOnce({ Items: [] });
    await expect(service.clearCart('user-123')).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });
});
