import axios from 'axios';

const CUSTOMER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || 'https://1zt0p8rywi.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const customerApi = axios.create({
  baseURL: CUSTOMER_API_BASE_URL,
});

customerApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

customerApi.interceptors.response.use(
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
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Customer {
  userId: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  profileImage?: string;
  address?: CustomerAddress | null;
  status?: 'Active' | 'Inactive' | 'Blocked' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

class CustomerService {
  async getAllCustomers(): Promise<Customer[]> {
    const response = await customerApi.get('/api/v1/users');
    // The backend envelope might be { success: true, data: [...] }
    const res = response.data;
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  }

  async getCustomerById(userId: string): Promise<Customer> {
    const response = await customerApi.get(`/api/v1/users/${userId}`);
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async updateCustomer(userId: string, data: Partial<Customer>): Promise<Customer> {
    const response = await customerApi.put(`/api/v1/users/${userId}`, data);
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }

  async updateCustomerStatus(userId: string, status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended'): Promise<Customer> {
    const response = await customerApi.put(`/api/v1/users/${userId}`, { status });
    const res = response.data;
    if (res && res.success && res.data) {
      return res.data;
    }
    return res;
  }
}

export const customerService = new CustomerService();
export default customerService;
