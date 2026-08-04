const brandService = require('../../src/services/brandService');
const reviewService = require('../../src/services/reviewService');
const wishlistService = require('../../src/services/wishlistService');

describe('wishlist-review services', () => {
  beforeEach(() => {
    global.docClientSendMock.mockReset();
    global.docClientSendMock.mockResolvedValue({ Items: [], Item: null });
  });

  test('brandService CRUD and errors', async () => {
    // name validation check
    await expect(brandService.createBrand({ name: '' })).rejects.toThrow('Brand name is required');

    global.docClientSendMock
      .mockResolvedValueOnce({}) // PutCommand inside create
      .mockResolvedValueOnce({ Items: [{ brandId: 'b1', name: 'Brand' }] }) // getAllBrands
      .mockResolvedValueOnce({ Item: { brandId: 'b1', name: 'Brand' } }) // getBrandById
      .mockResolvedValueOnce({ Item: { brandId: 'b1', name: 'Brand' } }) // getBrandById inside update
      .mockResolvedValueOnce({ Attributes: { brandId: 'b1', name: 'New' } }) // UpdateCommand inside update
      .mockResolvedValueOnce({ Item: { brandId: 'b1', name: 'Brand' } }) // getBrandById inside delete
      .mockResolvedValueOnce({}); // DeleteCommand inside delete

    await brandService.createBrand({ name: 'Brand' });
    const list = await brandService.getAllBrands();
    expect(list).toBeDefined();

    const brand = await brandService.getBrandById('b1');
    expect(brand.brandId).toBe('b1');

    await brandService.updateBrand('b1', { name: 'New' });
    await brandService.deleteBrand('b1');

    // Brand not found update
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(brandService.updateBrand('b1', { name: 'New' })).rejects.toThrow('Brand not found');

    // Brand not found delete
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(brandService.deleteBrand('b1')).rejects.toThrow('Brand not found');

    // Empty list returned (branch cover)
    global.docClientSendMock.mockResolvedValueOnce({});
    const listEmpty = await brandService.getAllBrands();
    expect(listEmpty).toEqual([]);

    // Update with empty fields (branch cover)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { brandId: 'b1', name: 'Old', logoUrl: 'old.png', description: 'old' } })
      .mockResolvedValueOnce({ Attributes: { brandId: 'b1', name: 'Old' } });
    await brandService.updateBrand('b1', {});

    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { brandId: 'b1', name: 'Old' } })
      .mockResolvedValueOnce({ Attributes: { brandId: 'b1', name: 'Old' } });
    await brandService.updateBrand('b1', {});
  });

  test('reviewService CRUD and errors', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({}) // PutCommand inside create
      .mockResolvedValueOnce({ Items: [{ reviewId: 'r1' }] }) // getProductReviews
      .mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u1' } }) // getReviewById inside update
      .mockResolvedValueOnce({}) // PutCommand inside update
      .mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u1' } }) // getReviewById inside delete
      .mockResolvedValueOnce({}) // DeleteCommand inside delete
      .mockResolvedValueOnce({ Items: [] }); // getAllReviews

    await reviewService.createReview({ productId: 'p1', userId: 'u1', rating: 5, comment: 'good' });
    const list = await reviewService.getProductReviews('p1');
    expect(list).toBeDefined();

    await reviewService.updateReview('u1', 'r1', { rating: 4, comment: 'better' });
    await reviewService.deleteReview('u1', 'r1', []);
    const all = await reviewService.getAllReviews();
    expect(all).toBeDefined();

    // Review not found update
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(reviewService.updateReview('u1', 'r1', {})).rejects.toThrow('Review not found');

    // Review unauthorized update
    global.docClientSendMock.mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u_other' } });
    await expect(reviewService.updateReview('u1', 'r1', {})).rejects.toThrow('Unauthorized to edit this review');

    // Review not found delete
    global.docClientSendMock.mockResolvedValueOnce({ Item: null });
    await expect(reviewService.deleteReview('u1', 'r1', [])).rejects.toThrow('Review not found');

    // Review unauthorized delete
    global.docClientSendMock.mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u_other' } });
    await expect(reviewService.deleteReview('u1', 'r1', [])).rejects.toThrow('Unauthorized to delete this review');

    // Empty list returned (branch cover)
    global.docClientSendMock.mockResolvedValueOnce({});
    const emptyList = await reviewService.getProductReviews('p1');
    expect(emptyList).toEqual([]);

    global.docClientSendMock.mockResolvedValueOnce({});
    const emptyAll = await reviewService.getAllReviews();
    expect(emptyAll).toEqual([]);

    // Update with empty/undefined values (branch cover)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u1', rating: 5, comment: 'old' } })
      .mockResolvedValueOnce({ Attributes: { reviewId: 'r1' } });
    await reviewService.updateReview('u1', 'r1', {});

    // Create review without optional arguments (branch cover)
    global.docClientSendMock.mockResolvedValueOnce({});
    await reviewService.createReview({ productId: 'p1', userId: 'u1', rating: 5 });

    // deleteReview without roles argument (branch cover)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { reviewId: 'r1', userId: 'u1' } })
      .mockResolvedValueOnce({});
    await reviewService.deleteReview('u1', 'r1');
  });

  test('wishlistService CRUD', async () => {
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: null }) // getWishlist inside addToWishlist
      .mockResolvedValueOnce({}) // PutCommand inside addToWishlist
      .mockResolvedValueOnce({ Item: { userId: 'user-123', products: ['p1'] } }) // getWishlist inside removeFromWishlist
      .mockResolvedValueOnce({}); // PutCommand inside removeFromWishlist

    const wishlist = await wishlistService.addToWishlist('user-123', 'p1');
    expect(wishlist.products).toContain('p1');

    await wishlistService.removeFromWishlist('user-123', 'p1');

    // Adding existing item check (branch cover)
    global.docClientSendMock
      .mockResolvedValueOnce({ Item: { userId: 'user-123', products: ['p1'] } }) // getWishlist contains p1
      .mockResolvedValueOnce({});
    const wishlist2 = await wishlistService.addToWishlist('user-123', 'p1');
    expect(wishlist2.products).toHaveLength(1);
  });
});
