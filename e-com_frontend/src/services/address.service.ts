import axios from 'axios';

const USER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || 'https://1zt0p8rywi.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const addressApi = axios.create({
  baseURL: USER_API_BASE_URL,
});

addressApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

addressApi.interceptors.response.use(
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

export interface CustomerAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName?: string;
  phone?: string;
  profileImage?: string;
  address?: CustomerAddress | null;
  role?: string;
}

class AddressService {
  async getAddress(): Promise<CustomerAddress | null> {
    const response = await addressApi.get('/api/v1/users/profile');
    const res = response.data;
    const profile = res.data || res;
    return profile?.address || null;
  }

  async saveAddress(address: CustomerAddress): Promise<CustomerAddress> {
    const response = await addressApi.put('/api/v1/users/profile', {
      address,
    });
    const res = response.data;
    const profile = res.data || res;
    return profile?.address || address;
  }

  async deleteAddress(): Promise<void> {
    await addressApi.put('/api/v1/users/profile', {
      address: null,
    });
  }

  async getProfile(): Promise<UserProfile> {
    const response = await addressApi.get('/api/v1/users/profile');
    const res = response.data;
    return res.data || res;
  }

  async updateProfile(fullName: string, phone: string): Promise<UserProfile> {
    const response = await addressApi.put('/api/v1/users/profile', {
      fullName,
      phone,
    });
    const res = response.data;
    return res.data || res;
  }
}

export const addressService = new AddressService();
export default addressService;
