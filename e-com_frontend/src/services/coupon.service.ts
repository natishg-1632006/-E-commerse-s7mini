import axios from 'axios';

const COUPON_API_BASE_URL = import.meta.env.VITE_COUPON_API_BASE_URL || 'https://0cm1uslcob.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const couponApi = axios.create({
  baseURL: COUPON_API_BASE_URL,
});

couponApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

couponApi.interceptors.response.use(
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

export interface CouponValidationResult {
  valid: boolean;
  couponCode: string;
  couponName: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  subtotal: number;
  discount: number;
  finalAmount: number;
}

export interface Coupon {
  couponId?: string;
  coupon_id?: string;
  id?: string;
  couponCode: string;
  couponName: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
  scope?: 'ALL' | 'PRODUCT' | 'CATEGORY';
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

class CouponService {
  async validateCoupon(couponCode: string, cartTotal: number, items: any[] = []): Promise<CouponValidationResult> {
    const response = await couponApi.post('/api/v1/coupons/validate', {
      couponCode,
      cartTotal,
      items,
    });
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async getCoupons(): Promise<any> {
    const response = await couponApi.get('/api/v1/coupons');
    return response.data;
  }

  async getCouponByCode(code: string): Promise<any> {
    const response = await couponApi.get(`/api/v1/coupons/${code}`);
    return response.data;
  }

  async createCoupon(data: Coupon): Promise<any> {
    const response = await couponApi.post('/api/v1/coupons', data);
    return response.data;
  }

  async updateCoupon(code: string, data: Coupon): Promise<any> {
    const response = await couponApi.put(`/api/v1/coupons/${code}`, data);
    return response.data;
  }

  async deleteCoupon(code: string): Promise<any> {
    const response = await couponApi.delete(`/api/v1/coupons/${code}`);
    return response.data;
  }
}

export const couponService = new CouponService();
export default couponService;
