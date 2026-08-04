const service = require('../../src/services/categoryService');
const snsPublisher = require('../../src/utils/snsPublisher');
const s3Helper = require('../../src/utils/s3Helper');

jest.mock('../../src/utils/snsPublisher');
jest.mock('../../src/utils/s3Helper');

describe('categoryService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('createCategory adds category', async () => {
    global.docClientSendMock.mockResolvedValue({});
    const res = await service.createCategory({ name: 'Electronics', description: 'Gadgets' });
    expect(res.name).toBe('Electronics');
  });

  test('getAllCategories returns sorted, filtered list', async () => {
    const mockItems = [
      { name: 'A Category', description: 'desc', status: 'ACTIVE', featured: true, orderIdx: 2 },
      { name: 'B Category', description: 'xyz', status: 'INACTIVE', featured: false, orderIdx: 1 }
    ];
    global.docClientSendMock.mockResolvedValue({ Items: mockItems });

    const query = {
      search: 'category',
      status: 'ACTIVE',
      featured: 'true',
      sortBy: 'name',
      order: 'desc',
      page: '1',
      limit: '10'
    };
    const list1 = await service.getAllCategories(query);
    expect(list1.categories).toHaveLength(1);

    // Test sorting by number (orderIdx)
    const list2 = await service.getAllCategories({ sortBy: 'orderIdx', order: 'asc' });
    expect(list2.categories[0].orderIdx).toBe(1);
  });

  test('getCategoryById returns details', async () => {
    global.docClientSendMock.mockResolvedValue({ Item: { categoryId: 'c1' } });
    const res = await service.getCategoryById('c1');
    expect(res.categoryId).toBe('c1');
  });

  test('updateCategory modifies category, deletes old image and publishes SNS', async () => {
    // Normal update with image deletion
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { categoryId: 'c1', name: 'Old', image: { key: 'old.jpg' } } }) // getCategoryById
      .mockResolvedValueOnce({ Attributes: { categoryId: 'c1', name: 'New' } }); // UpdateCommand
    s3Helper.deleteImageFromS3.mockResolvedValue({});
    snsPublisher.publishCategoryUpdated.mockResolvedValue({});

    const res = await service.updateCategory('c1', { name: 'New', image: { key: 'new.jpg' } });
    expect(res.name).toBe('New');
    expect(s3Helper.deleteImageFromS3).toHaveBeenCalledWith('old.jpg');

    // Not found
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    const resNull = await service.updateCategory('c2', {});
    expect(resNull).toBeNull();

    // SNS publish fail
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { categoryId: 'c1', name: 'Old' } })
      .mockResolvedValueOnce({ Attributes: { categoryId: 'c1', name: 'New' } });
    snsPublisher.publishCategoryUpdated.mockRejectedValue(new Error('SNS Fail'));
    await service.updateCategory('c1', { name: 'New' }); // Should catch internally and not throw
  });

  test('generateCategoryUploadUrl', async () => {
    s3Helper.generateUploadUrl.mockResolvedValue('url');
    const res = await service.generateCategoryUploadUrl('test.jpg', 'image/jpeg');
    expect(res).toBe('url');
  });
});
