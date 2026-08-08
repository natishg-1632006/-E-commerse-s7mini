import axios from 'axios';

const PAYMENT_API_BASE_URL = 'https://ptmx1zxx9i.execute-api.ap-southeast-1.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const paymentApi = axios.create({
  baseURL: PAYMENT_API_BASE_URL,
});

paymentApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

paymentApi.interceptors.response.use(
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

class PaymentService {
  // Legacy / COD fallback support
  async createPayment(orderId: string, paymentMethod: string): Promise<any> {
    const response = await paymentApi.post('/api/v1/payment/create', {
      orderId,
      paymentMethod,
    });
    return response.data;
  }

  // Create Razorpay Order
  async createRazorpayOrder(orderId: string): Promise<any> {
    const response = await paymentApi.post('/api/v1/payment/create-order', {
      orderId,
    });
    return response.data;
  }

  // Verify Razorpay Payment Signature
  async verifyPayment(
    internalOrderId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ): Promise<any> {
    const response = await paymentApi.post('/api/v1/payment/verify', {
      internalOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
