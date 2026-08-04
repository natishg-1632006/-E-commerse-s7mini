const controller = require('../../src/controllers/categoryController');
const service = require('../../src/services/categoryService');

jest.mock('../../src/services/categoryService');

describe('categoryController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('createCategory success and error', async () => {
    service.createCategory.mockResolvedValue({ categoryId: 'c1' });
    await controller.createCategory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const err = new Error('fail');
    service.createCategory.mockRejectedValue(err);
    await controller.createCategory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCategories success and error', async () => {
    service.getAllCategories.mockResolvedValue({ categories: [], meta: {} });
    await controller.getCategories(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getAllCategories.mockRejectedValue(err);
    await controller.getCategories(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCategory success and error', async () => {
    req.params.id = 'c1';
    service.getCategoryById.mockResolvedValue({ id: 'c1' });
    await controller.getCategory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.getCategoryById.mockRejectedValue(err);
    await controller.getCategory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('getCategory not found', async () => {
    req.params.id = 'c1';
    service.getCategoryById.mockResolvedValue(null);
    await controller.getCategory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateCategory success and error', async () => {
    req.params.id = 'c1';
    service.updateCategory.mockResolvedValue({});
    await controller.updateCategory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.updateCategory.mockRejectedValue(err);
    await controller.updateCategory(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('generateUploadUrl success and error', async () => {
    req.body = { fileName: 'test.jpg', contentType: 'image/jpeg' };
    service.generateCategoryUploadUrl.mockResolvedValue({});
    await controller.generateUploadUrl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    const err = new Error('fail');
    service.generateCategoryUploadUrl.mockRejectedValue(err);
    await controller.generateUploadUrl(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
