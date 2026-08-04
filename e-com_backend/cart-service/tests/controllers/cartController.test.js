const controller = require('../../src/controllers/cartController');
const service = require('../../src/services/cartService');

jest.mock('../../src/services/cartService');

describe('cartController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { user: { sub: 'user-123' }, body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('getCart success and error', async () => {
    service.getCart.mockResolvedValue({ userId: 'user-123', items: [] });
    await controller.getCart(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const err = new Error('fail');
    service.getCart.mockRejectedValue(err);
    await controller.getCart(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCart not found returns 404', async () => {
    service.getCart.mockResolvedValue(null);
    await controller.getCart(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('addToCart success and error', async () => {
    req.body = { productId: 'p1', quantity: 2 };
    service.addToCart.mockResolvedValue({});
    await controller.addToCart(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.addToCart.mockRejectedValue(err);
    await controller.addToCart(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('updateQuantity success and error', async () => {
    req.body = { productId: 'p1', quantity: 3 };
    service.updateQuantity.mockResolvedValue({});
    await controller.updateQuantity(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.updateQuantity.mockRejectedValue(err);
    await controller.updateQuantity(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('removeItem success and error', async () => {
    req.params = { productId: 'p1' };
    service.removeItem.mockResolvedValue({});
    await controller.removeItem(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.removeItem.mockRejectedValue(err);
    await controller.removeItem(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('clearCart success and error', async () => {
    service.clearCart.mockResolvedValue({ message: 'cleared' });
    await controller.clearCart(req, res, next);
    expect(res.json).toHaveBeenCalled();

    const err = new Error('fail');
    service.clearCart.mockRejectedValue(err);
    await controller.clearCart(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
