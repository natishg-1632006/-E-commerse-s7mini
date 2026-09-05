import axios from 'axios';

const CART_API_BASE_URL = import.meta.env.VITE_CART_API_BASE_URL || 'https://a2m5rzby0e.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const cartApi = axios.create({
  baseURL: CART_API_BASE_URL,
});

cartApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

cartApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('natcart_access_token');
      localStorage.removeItem('natcart_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  // Dynamic fields mapped from product details
  image?: string;
  brand?: string;
  stock?: number;
  ram?: string;
  storage?: string;
}

export interface Cart {
  cartid: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
}

class CartService {
  async getCart(): Promise<Cart | null> {
    try {
      const response = await cartApi.get('/api/v1/cart', {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      });
      if (response.status === 404) {
        return null;
      }
      const res = response.data;
      if (res && res.success && res.data) {
        return res.data;
      }
      return res || null;
    } catch (error) {
      return null;
    }
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const response = await cartApi.post('/api/v1/cart/add', { productId, quantity });
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async updateQuantity(productId: string, quantity: number): Promise<Cart> {
    const response = await cartApi.put('/api/v1/cart/update', { productId, quantity });
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async removeItem(productId: string): Promise<Cart> {
    const response = await cartApi.delete(`/api/v1/cart/remove/${productId}`);
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async clearCart(): Promise<any> {
    const response = await cartApi.delete('/api/v1/cart/clear');
    return response.data;
  }
}

export const cartService = new CartService();
export default cartService;
