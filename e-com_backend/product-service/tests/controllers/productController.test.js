const controller = require('../../src/controllers/productController');
const service = require('../../src/services/productService');

jest.mock('../../src/services/productService');

describe('productController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { user: { sub: 'user-123' }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('getProducts success and error', async () => {
    service.getAllProducts.mockResolvedValue({ products: [], meta: {} });
    await controller.getProducts(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getAllProducts.mockRejectedValue(new Error('fail'));
    await controller.getProducts(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getFeaturedProducts success and error', async () => {
    service.getFeaturedProducts.mockResolvedValue([]);
    await controller.getFeaturedProducts(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getFeaturedProducts.mockRejectedValue(new Error('fail'));
    await controller.getFeaturedProducts(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getProduct success, 404, and error', async () => {
    req.params.id = 'p1';
    service.getProductById.mockResolvedValue({ productId: 'p1' });
    await controller.getProduct(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.getProductById.mockResolvedValue(null);
    await controller.getProduct(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    service.getProductById.mockRejectedValue(new Error('fail'));
    await controller.getProduct(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('getProductsByIds success and error', async () => {
    req.body.productIds = ['p1'];
    service.getProductsByIds.mockResolvedValue([]);
    await controller.getProductsByIds(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.getProductsByIds.mockRejectedValue(new Error('fail'));
    await controller.getProductsByIds(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('createProduct success and error', async () => {
    req.body = { name: 'P' };
    service.createProduct.mockResolvedValue({ productId: 'p1' });
    await controller.createProduct(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    service.createProduct.mockRejectedValue(new Error('fail'));
    await controller.createProduct(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('updateProduct success, 404, and error', async () => {
    req.params.id = 'p1';
    service.updateProduct.mockResolvedValue({ productId: 'p1' });
    await controller.updateProduct(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.updateProduct.mockResolvedValue(null);
    await controller.updateProduct(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    service.updateProduct.mockRejectedValue(new Error('fail'));
    await controller.updateProduct(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('deleteProduct success, 404, and error', async () => {
    req.params.id = 'p1';
    service.deleteProduct.mockResolvedValue({ productId: 'p1' });
    await controller.deleteProduct(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.deleteProduct.mockResolvedValue(null);
    await controller.deleteProduct(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    service.deleteProduct.mockRejectedValue(new Error('fail'));
    await controller.deleteProduct(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('generateUploadUrl success and error', async () => {
    req.body = { fileName: 'a.png', contentType: 'image/png' };
    service.generateUploadUrl.mockResolvedValue({});
    await controller.generateUploadUrl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    service.generateUploadUrl.mockRejectedValue(new Error('fail'));
    await controller.generateUploadUrl(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('generateUploadUrls success and error', async () => {
    req.body = { files: ['a.png'] };
    service.generateUploadUrls.mockResolvedValue({});
    await controller.generateUploadUrls(req, res, next);
    expect(res.json).toHaveBeenCalled();

    service.generateUploadUrls.mockRejectedValue(new Error('fail'));
    await controller.generateUploadUrls(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
