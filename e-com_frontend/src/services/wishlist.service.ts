import axios from 'axios';

const WISHLIST_REVIEW_API_BASE_URL = import.meta.env.VITE_WISHLIST_REVIEW_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://ptmx1zxx9i.execute-api.ap-southeast-1.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const wishlistApi = axios.create({
  baseURL: WISHLIST_REVIEW_API_BASE_URL,
});

wishlistApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class WishlistService {
  async getWishlist(userId: string): Promise<string[]> {
    try {
      const response = await wishlistApi.get(`/api/v1/wishlist/${userId}`);
      return response.data.data?.products || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  async addToWishlist(productId: string): Promise<string[]> {
    const response = await wishlistApi.post('/api/v1/wishlist', { productId });
    return response.data.data?.products || [];
  }

  async removeFromWishlist(productId: string): Promise<string[]> {
    const response = await wishlistApi.delete(`/api/v1/wishlist/${productId}`);
    return response.data.data?.products || [];
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
