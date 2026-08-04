const productService = require('../../src/services/productService');
const { getCategory } = require('../../src/utils/categoryApi');
const { publishProductCreated, publishProductDeleted } = require('../../src/utils/productPublisher');
const { deleteImageFromS3 } = require('../../src/utils/s3Helper');

jest.mock('../../src/utils/categoryApi');
jest.mock('../../src/utils/productPublisher');
jest.mock('../../src/utils/s3Helper');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('http://mock-upload-url')
}));
jest.mock('../../src/utils/fileHandler', () => ({
  docClient: {
    send: (...args) => global.docClientSendMock(...args)
  },
  TABLE_NAME: 'test-products'
}));

describe('productService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('getAllProducts with search, filter and sort', async () => {
    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { productId: 'p1', name: 'Apple iPhone', description: 'Phone', brand: 'Apple', category: 'Mobile', price: 1000, createdAt: '2026-08-04T10:00:00Z' },
        { productId: 'p2', name: 'Samsung Galaxy', description: 'Android', brand: 'Samsung', category: 'Mobile', price: 800, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    
    const query = {
      search: 'Apple',
      category: 'Mobile',
      brand: 'Apple',
      minPrice: 500,
      maxPrice: 1500,
      sort: 'priceAsc',
      page: '1',
      limit: '10'
    };
    const res = await productService.getAllProducts(query);
    expect(res.products).toHaveLength(1);
    expect(res.meta.total).toBe(1);
    
    // Sort checks
    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { name: 'A', price: 10, createdAt: '2026-08-04T10:00:00Z' },
        { name: 'B', price: 20, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    const res2 = await productService.getAllProducts({ sort: 'priceDesc' });
    expect(res2.products[0].name).toBe('B');

    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { name: 'A', price: 10, createdAt: '2026-08-04T10:00:00Z' },
        { name: 'B', price: 20, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    const res3 = await productService.getAllProducts({ sort: 'latest' });
    expect(res3.products[0].name).toBe('A');

    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { name: 'A', price: 10, createdAt: '2026-08-04T10:00:00Z' },
        { name: 'B', price: 20, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    const res4 = await productService.getAllProducts({ sort: 'oldest' });
    expect(res4.products[0].name).toBe('B');

    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { name: 'B', price: 10, createdAt: '2026-08-04T10:00:00Z' },
        { name: 'A', price: 20, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    const res5 = await productService.getAllProducts({ sort: 'nameAsc' });
    expect(res5.products[0].name).toBe('A');

    global.docClientSendMock.mockResolvedValueOnce({
      Items: [
        { name: 'A', price: 10, createdAt: '2026-08-04T10:00:00Z' },
        { name: 'B', price: 20, createdAt: '2026-08-03T10:00:00Z' }
      ]
    });
    const res6 = await productService.getAllProducts({ sort: 'nameDesc' });
    expect(res6.products[0].name).toBe('B');
  });

  test('getProductById', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1' } });
    const res1 = await productService.getProductById('p1');
    expect(res1.productId).toBe('p1');

    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    const res2 = await productService.getProductById('p1');
    expect(res2).toBeNull();
  });

  test('createProduct success and errors', async () => {
    getCategory.mockResolvedValueOnce({ status: 'ACTIVE', name: 'Mobile' });
    global.docClientSendMock.mockResolvedValueOnce({});
    publishProductCreated.mockResolvedValueOnce({});
    const res1 = await productService.createProduct({ categoryId: 'cat1', name: 'iPhone', price: '1000' });
    expect(res1.categoryName).toBe('Mobile');

    getCategory.mockResolvedValueOnce(null);
    await expect(productService.createProduct({ categoryId: 'cat1' })).rejects.toThrow('Category not found');

    getCategory.mockResolvedValueOnce({ status: 'INACTIVE' });
    await expect(productService.createProduct({ categoryId: 'cat1' })).rejects.toThrow('Category is inactive');
  });

  test('getProductsByIds invalid and valid', async () => {
    await expect(productService.getProductsByIds(null)).rejects.toThrow('productIds array is required');
    await expect(productService.getProductsByIds([])).rejects.toThrow('productIds array is required');

    global.docClientSendMock.mockResolvedValueOnce({ Responses: { 'test-products': [{ productId: 'p1' }] } });
    const res = await productService.getProductsByIds(['p1']);
    expect(res).toHaveLength(1);
  });

  test('updateProduct success, 404, images deletion, category resolve', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1', images: [{ key: 'old.jpg' }] } });
    deleteImageFromS3.mockResolvedValueOnce({});
    getCategory.mockResolvedValueOnce({ name: 'NewCat' });
    global.docClientSendMock.mockResolvedValueOnce({ Attributes: { productId: 'p1', categoryName: 'NewCat' } });

    const res1 = await productService.updateProduct('p1', {
      images: [{ key: 'new.jpg' }],
      categoryId: 'cat2',
      price: 1200
    });
    expect(res1).toBeDefined();

    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    const res2 = await productService.updateProduct('p2', {});
    expect(res2).toBeNull();
  });

  test('getFeaturedProducts', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ productId: 'p1', createdAt: '2026' }] });
    const res = await productService.getFeaturedProducts();
    expect(res).toHaveLength(1);
  });

  test('deleteProduct success, 404, and image deletion', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { productId: 'p1', images: [{ key: 'a.jpg' }] } });
    deleteImageFromS3.mockResolvedValueOnce({});
    global.docClientSendMock.mockResolvedValueOnce({});
    publishProductDeleted.mockResolvedValueOnce({});

    const res1 = await productService.deleteProduct('p1');
    expect(res1.productId).toBe('p1');

    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    const res2 = await productService.deleteProduct('p2');
    expect(res2).toBeNull();
  });

  test('generateUploadUrl and generateUploadUrls', async () => {
    const res1 = await productService.generateUploadUrl('a.png', 'image/png');
    expect(res1.uploadUrl).toBeDefined();

    const res2 = await productService.generateUploadUrls(['a.png']);
    expect(res2.images).toHaveLength(1);

    await expect(productService.generateUploadUrls(null)).rejects.toThrow('files array is required');
  });

  test('processCategoryEvent updates category name', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ productId: 'p1' }] });
    global.docClientSendMock.mockResolvedValueOnce({});
    await productService.processCategoryEvent({ eventType: 'CATEGORY_UPDATED', categoryId: 'cat1', categoryName: 'NewName' });
  });
});
