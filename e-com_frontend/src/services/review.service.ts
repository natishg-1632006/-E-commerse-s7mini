import axios from 'axios';

const WISHLIST_REVIEW_API_BASE_URL = import.meta.env.VITE_WISHLIST_REVIEW_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://ptmx1zxx9i.execute-api.ap-southeast-1.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const reviewApi = axios.create({
  baseURL: WISHLIST_REVIEW_API_BASE_URL,
});

reviewApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Review {
  reviewId: string;
  productId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

class ReviewService {
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const response = await reviewApi.get(`/api/v1/reviews/product/${productId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }
  }

  async submitReview(productId: string, rating: number, comment: string, username?: string): Promise<Review> {
    const response = await reviewApi.post('/api/v1/reviews', {
      productId,
      rating,
      comment,
      username,
    });
    return response.data.data;
  }

  async updateReview(reviewId: string, rating: number, comment: string): Promise<Review> {
    const response = await reviewApi.put(`/api/v1/reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    await reviewApi.delete(`/api/v1/reviews/${reviewId}`);
  }

  async getAllReviews(): Promise<Review[]> {
    try {
      const response = await reviewApi.get('/api/v1/reviews');
      return response.data.data || [];
    } catch (error) {
      // Suppress 403 Forbidden logs silently for standard users
      return [];
    }
  }
}

export const reviewService = new ReviewService();
export default reviewService;
