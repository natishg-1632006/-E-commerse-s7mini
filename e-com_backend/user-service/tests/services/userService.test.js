const service = require('../../src/services/userService');
describe('userService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
  });

  test('getUserById returns profile or null', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { userId: 'user-123' } });
    const res1 = await service.getUserById('user-123');
    expect(res1.userId).toBe('user-123');

    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    const res2 = await service.getUserById('user-123');
    expect(res2).toBeNull();
  });

  test('getOrCreateProfile returning existing or creating new', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { userId: 'user-123', email: 'test@email.com' } });
    const res1 = await service.getOrCreateProfile('user-123', 'test@email.com');
    expect(res1.userId).toBe('user-123');

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: null })
      .mockResolvedValueOnce({});
    const res2 = await service.getOrCreateProfile('user-123', 'test@email.com');
    expect(res2.email).toBe('test@email.com');
  });

  test('getProfile returning existing or creating empty', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Item: { userId: 'user-123' } });
    const res1 = await service.getProfile('user-123');
    expect(res1.userId).toBe('user-123');

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: null })
      .mockResolvedValueOnce({});
    const res2 = await service.getProfile('user-123');
    expect(res2.userId).toBe('user-123');
  });

  test('updateProfile success, not found, status config', async () => {
    // 1. All fields defined
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { userId: 'user-123', fullName: 'Old Name' } })
      .mockResolvedValueOnce({ Attributes: { userId: 'user-123', fullName: 'New Name' } });
    
    const res1 = await service.updateProfile('user-123', {
      fullName: 'New Name',
      phone: '1234567890',
      profileImage: 'image.png',
      address: '123 Main St',
      status: 'Active'
    });
    expect(res1.fullName).toBe('New Name');

    // 2. No fields defined (fall back to existing values)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { userId: 'user-123', fullName: 'Old Name' } })
      .mockResolvedValueOnce({ Attributes: { userId: 'user-123', fullName: 'Old Name' } });
    
    const res2 = await service.updateProfile('user-123', {});
    expect(res2.fullName).toBe('Old Name');

    // 3. User not found
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(service.updateProfile('user-123', {})).rejects.toThrow('User profile not found');
  });

  test('getAllUsers', async () => {
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ userId: 'user-123' }] });
    const res = await service.getAllUsers();
    expect(res).toHaveLength(1);
  });
});
