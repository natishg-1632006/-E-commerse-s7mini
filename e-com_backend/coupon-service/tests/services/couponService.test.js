const service = require('../../src/services/couponService');
describe('couponService', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
    jest.clearAllMocks();
  });

  test('createCoupon throws error if duplicate', async () => {
    global.docClientSendMock.mockResolvedValue({ Item: { couponCode: 'DISCOUNT' } });
    await expect(service.createCoupon({ couponCode: 'DISCOUNT' })).rejects.toThrow('Coupon already exists');
  });

  test('createCoupon puts coupon', async () => {
    global.docClientSendMock.mockResolvedValue({ Item: null }); // duplicate check
    const coupon = await service.createCoupon({ couponCode: 'DISCOUNT', couponName: 'Discount', discountType: 'PERCENTAGE', discountValue: 10, minimumOrderAmount: 50 });
    expect(coupon.couponCode).toBe('DISCOUNT');
  });

  test('getCouponByCode throws if missing', async () => {
    global.docClientSendMock.mockResolvedValue({ Item: null });
    await expect(service.getCouponByCode('DISCOUNT')).rejects.toThrow('Coupon not found');
  });

  test('validateCoupon basic checks', async () => {
    // Inactive
    global.docClientSendMock.mockResolvedValue({ Item: { couponCode: 'DISCOUNT', isActive: false } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 200 })).rejects.toThrow('Coupon is inactive');

    // Expired
    global.docClientSendMock.mockResolvedValue({ Item: { couponCode: 'DISCOUNT', isActive: true, expiryDate: '2020-01-01' } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 200 })).rejects.toThrow('Coupon has expired');

    // Min Order
    global.docClientSendMock.mockResolvedValue({ Item: { couponCode: 'DISCOUNT', isActive: true, minimumOrderAmount: 500 } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 200 })).rejects.toThrow('Minimum order amount');
  });

  test('validateCoupon scope and discount types', async () => {
    const baseCoupon = { couponCode: 'DISCOUNT', isActive: true, discountType: 'PERCENTAGE', discountValue: 10, minimumOrderAmount: 100 };

    // PRODUCT scope success
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, scope: 'PRODUCT', applicableProducts: ['p1'] } });
    const res1 = await service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 150, items: [{ productId: 'p1', subtotal: 100 }] });
    expect(res1.discount).toBe(10);

    // PRODUCT scope mismatch
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, scope: 'PRODUCT', applicableProducts: ['p1'] } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 150, items: [{ productId: 'p2', subtotal: 100 }] })).rejects.toThrow('Coupon is not applicable');

    // CATEGORY scope success
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, scope: 'CATEGORY', applicableCategories: ['c1'] } });
    const res2 = await service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 150, items: [{ categoryId: 'c1', subtotal: 100 }] });
    expect(res2.discount).toBe(10);

    // CATEGORY scope mismatch
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, scope: 'CATEGORY', applicableCategories: ['c1'] } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 150, items: [{ categoryId: 'c2', subtotal: 100 }] })).rejects.toThrow('Coupon is not applicable');

    // Invalid scope
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, scope: 'INVALID' } });
    await expect(service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 150, items: [] })).rejects.toThrow('Invalid coupon scope');

    // FIXED discount capped
    global.docClientSendMock.mockResolvedValue({ Item: { ...baseCoupon, discountType: 'FIXED', discountValue: 500, scope: 'ALL' } });
    const res3 = await service.validateCoupon({ couponCode: 'DISCOUNT', cartTotal: 200, items: [] });
    expect(res3.discount).toBe(200); // capped at subtotal
  });

  test('getAllCoupons, updateCoupon, deleteCoupon', async () => {
    // getAll
    global.docClientSendMock.mockResolvedValueOnce({ Items: [{ couponCode: 'C1', createdAt: '2026-08-01' }, { couponCode: 'C2', createdAt: '2026-08-04' }] });
    const list = await service.getAllCoupons();
    expect(list[0].couponCode).toBe('C2'); // sorted by createdAt newest

    // update
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { couponCode: 'C1', discountValue: 10 } }) // getByCode
      .mockResolvedValueOnce({}); // put
    const updated = await service.updateCoupon('C1', { discountValue: 20 });
    expect(updated.discountValue).toBe(20);

    // delete
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { couponCode: 'C1' } }) // getByCode
      .mockResolvedValueOnce({}); // delete
    const resDel = await service.deleteCoupon('C1');
    expect(resDel.message).toContain('deleted successfully');
  });
});
