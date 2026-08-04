const brandController = require('../../src/controllers/brandController');
const reviewController = require('../../src/controllers/reviewController');
const wishlistController = require('../../src/controllers/wishlistController');
const brandService = require('../../src/services/brandService');
const reviewService = require('../../src/services/reviewService');
const wishlistService = require('../../src/services/wishlistService');

jest.mock('../../src/services/brandService');
jest.mock('../../src/services/reviewService');
jest.mock('../../src/services/wishlistService');

describe('wishlist-review controllers', () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      user: { sub: 'user-123', username: 'john', email: 'john@test.com', 'cognito:groups': ['Admin'] },
      body: {},
      params: {},
      query: {},
      headers: { authorization: 'Bearer token' }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('brandController endpoints success and fail', async () => {
    // createBrand success
    req.body = { name: 'Brand Name' };
    brandService.createBrand.mockResolvedValue({});
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createBrand forbidden
    req.user['cognito:groups'] = [];
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // createBrand fallback groups list
    req.user['cognito:groups'] = undefined;
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // createBrand missing name
    req.user['cognito:groups'] = ['Admin'];
    req.body = {};
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // getAllBrands
    brandService.getAllBrands.mockResolvedValue([]);
    await brandController.getAllBrands(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // getBrandById success
    req.params.brandId = 'b1';
    brandService.getBrandById.mockResolvedValue({ id: 'b1' });
    await brandController.getBrandById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // getBrandById not found
    brandService.getBrandById.mockResolvedValue(null);
    await brandController.getBrandById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // updateBrand success
    req.body = { name: 'New' };
    brandService.updateBrand.mockResolvedValue({});
    await brandController.updateBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // updateBrand unauthorized
    req.user['cognito:groups'] = [];
    await brandController.updateBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // updateBrand fallback groups
    req.user['cognito:groups'] = undefined;
    await brandController.updateBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // deleteBrand success
    req.user['cognito:groups'] = ['Admin'];
    await brandController.deleteBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // deleteBrand unauthorized
    req.user['cognito:groups'] = [];
    await brandController.deleteBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // deleteBrand fallback groups
    req.user['cognito:groups'] = undefined;
    await brandController.deleteBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('reviewController endpoints success and fail', async () => {
    // createReview success - body username
    req.body = { productId: 'p1', rating: 5, comment: 'good', username: 'BodyUser' };
    req.params = { productId: 'p1' };
    global.axiosMock.get.mockResolvedValue({
      data: [{ orderStatus: 'COMPLETED', items: [{ productId: 'p1' }] }]
    });
    reviewService.createReview.mockResolvedValue({});
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview success - user.username fallback
    req.body = { productId: 'p1', rating: 5 };
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview success - user.email fallback
    req.user.username = undefined;
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview success - Verified Buyer fallback
    req.user.email = undefined;
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview validation error - missing product
    req.body = { rating: 5 };
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // createReview validation error - missing rating
    req.body = { productId: 'p1' };
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // createReview order nested data branch
    req.body = { productId: 'p1', rating: 5 };
    global.axiosMock.get.mockResolvedValue({
      data: { data: [{ status: 'COMPLETED', items: [{ product_id: 'p1' }] }] }
    });
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview order nested orders branch
    global.axiosMock.get.mockResolvedValue({
      data: { orders: [{ order_status: 'COMPLETED', items: [{ id: 'p1' }] }] }
    });
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    // createReview no completed order
    global.axiosMock.get.mockResolvedValue({ data: [] });
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // createReview order service returns 404
    const err404 = new Error('Not Found');
    err404.response = { status: 404 };
    global.axiosMock.get.mockRejectedValue(err404);
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // getProductReviews success
    req.params = { productId: 'p1' };
    reviewService.getProductReviews.mockResolvedValue([]);
    await reviewController.getProductReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // updateReview success
    req.params = { reviewId: 'r1' };
    req.body = { rating: 4 };
    reviewService.updateReview.mockResolvedValue({});
    await reviewController.updateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // updateReview validation error
    req.body = {};
    await reviewController.updateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // deleteReview success
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // deleteReview fallback groups
    req.user['cognito:groups'] = undefined;
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // getAllReviews success
    req.user['cognito:groups'] = ['Admin'];
    reviewService.getAllReviews.mockResolvedValue([]);
    await reviewController.getAllReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('wishlistController endpoints success', async () => {
    // getWishlist
    req.params.userId = 'user-123';
    wishlistService.getWishlist.mockResolvedValue({});
    await wishlistController.getWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // addToWishlist
    req.body = { productId: 'p1' };
    wishlistService.addToWishlist.mockResolvedValue({});
    await wishlistController.addToWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // removeFromWishlist
    req.params = { productId: 'p1' };
    wishlistService.removeFromWishlist.mockResolvedValue({});
    await wishlistController.removeFromWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('error handling catch blocks', async () => {
    // brandController failures
    brandService.createBrand.mockRejectedValue(new Error('fail'));
    req.body = { name: 'Brand' };
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    brandService.createBrand.mockRejectedValue(new Error('name is required'));
    await brandController.createBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    brandService.getAllBrands.mockRejectedValue(new Error('fail'));
    await brandController.getAllBrands(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    brandService.getBrandById.mockRejectedValue(new Error('fail'));
    req.params.brandId = 'b1';
    await brandController.getBrandById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    brandService.updateBrand.mockRejectedValue(new Error('fail'));
    req.body = { name: 'New' };
    await brandController.updateBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    brandService.updateBrand.mockRejectedValue(new Error('Brand not found.'));
    await brandController.updateBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    brandService.deleteBrand.mockRejectedValue(new Error('fail'));
    await brandController.deleteBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    brandService.deleteBrand.mockRejectedValue(new Error('Brand not found.'));
    await brandController.deleteBrand(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // reviewController failures
    reviewService.getProductReviews.mockRejectedValue(new Error('fail'));
    req.params = { productId: 'p1' };
    await reviewController.getProductReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // getProductReviews missing productId
    req.params = {};
    await reviewController.getProductReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // createReview order check failure
    req.body = { productId: 'p1', rating: 5 };
    req.params = { productId: 'p1' };
    global.axiosMock.get.mockRejectedValue(new Error('axios fail'));
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // createReview failure
    req.body = { productId: 'p1', rating: 5 };
    global.axiosMock.get.mockResolvedValue({ data: [{ orderStatus: 'COMPLETED', items: [{ productId: 'p1' }] }] });
    reviewService.createReview.mockRejectedValue(new Error('fail'));
    await reviewController.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // updateReview failures
    reviewService.updateReview.mockRejectedValue(new Error('fail'));
    req.params = { reviewId: 'r1' };
    req.body = { rating: 4 };
    await reviewController.updateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    reviewService.updateReview.mockRejectedValue(new Error('Unauthorized to edit this review.'));
    await reviewController.updateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // deleteReview failures
    reviewService.deleteReview.mockRejectedValue(new Error('fail'));
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    reviewService.deleteReview.mockRejectedValue(new Error('Unauthorized to delete this review.'));
    await reviewController.deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // getAllReviews failures
    reviewService.getAllReviews.mockRejectedValue(new Error('fail'));
    await reviewController.getAllReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // getAllReviews forbidden
    req.user['cognito:groups'] = [];
    await reviewController.getAllReviews(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    // wishlistController failures
    req.user['cognito:groups'] = ['Admin'];
    wishlistService.getWishlist.mockRejectedValue(new Error('fail'));
    req.params = { userId: 'user-123' };
    await wishlistController.getWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // getWishlist forbidden
    req.params = { userId: 'other-user' };
    await wishlistController.getWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    wishlistService.addToWishlist.mockRejectedValue(new Error('fail'));
    req.body = { productId: 'p1' };
    await wishlistController.addToWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // addToWishlist missing productId
    req.body = {};
    await wishlistController.addToWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    wishlistService.removeFromWishlist.mockRejectedValue(new Error('fail'));
    req.params = { productId: 'p1' };
    await wishlistController.removeFromWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // removeFromWishlist missing productId
    req.params = {};
    await wishlistController.removeFromWishlist(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
