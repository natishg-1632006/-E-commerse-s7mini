import axios from 'axios';

const INVENTORY_API_BASE_URL = 'https://ptmx1zxx9i.execute-api.ap-southeast-1.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const inventoryApi = axios.create({
  baseURL: INVENTORY_API_BASE_URL,
});

inventoryApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Also include internal service key header for /increase since it requires service auth
    if (config.url === '/api/v1/inventory/increase') {
      config.headers['x-service-key'] = 'my-super-secret-key-123';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface InventoryResponse {
  productId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  soldQuantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  lastUpdated: string;
}

class InventoryService {
  async getAllInventory() {
    const response = await inventoryApi.get('/api/v1/inventory');
    return response.data;
  }

  async getInventoryByProductId(productId: string) {
    const response = await inventoryApi.get(`/api/v1/inventory/${productId}`);
    return response.data;
  }

  async checkStock(productId: string, quantity: number = 1) {
    const response = await inventoryApi.get(`/api/v1/inventory/check/${productId}`, {
      params: { quantity }
    });
    return response.data;
  }

  async updateInventoryThreshold(productId: string, threshold: number) {
    const response = await inventoryApi.put(`/api/v1/inventory/${productId}`, {
      lowStockThreshold: threshold
    });
    return response.data;
  }

  async increaseStock(productId: string, quantity: number, reason: string) {
    const response = await inventoryApi.post('/api/v1/inventory/increase', {
      productId,
      quantity,
      reason
    });
    return response.data;
  }

  async decreaseStock(productId: string, quantity: number, reason: string) {
    const response = await inventoryApi.post('/api/v1/inventory/decrease', {
      productId,
      quantity,
      reason
    });
    return response.data;
  }

  async getLowStockInventory() {
    const response = await inventoryApi.get('/api/v1/inventory/low-stock');
    return response.data;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
