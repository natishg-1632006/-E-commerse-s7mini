import axios from 'axios';

const PRODUCT_API_BASE_URL = import.meta.env.VITE_PRODUCT_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://tfwlxt4uda.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const productApi = axios.create({
  baseURL: PRODUCT_API_BASE_URL,
});

productApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

productApi.interceptors.response.use(
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

export interface ProductImagePayload {
  key: string;
  url: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  price: number;
  images: ProductImagePayload[];
  specifications: Record<string, string>;
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

class ProductService {
  async getProducts(params: GetProductsParams) {
    const queryParams: any = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.category) queryParams.category = params.category;
    if (params.brand) queryParams.brand = params.brand;
    if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
    if (params.sort) queryParams.sort = params.sort;

    const response = await productApi.get('/api/v1/products', { params: queryParams });
    return response.data;
  }

  async getProductById(id: string) {
    const response = await productApi.get(`/api/v1/products/${id}`);
    return response.data;
  }

  async getProductsByIds(productIds: string[]) {
    const response = await productApi.post('/api/v1/products/batch', { productIds });
    return response.data;
  }

  async createProduct(data: ProductPayload) {
    const response = await productApi.post('/api/v1/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: Partial<ProductPayload>) {
    const response = await productApi.put(`/api/v1/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await productApi.delete(`/api/v1/products/${id}`);
    return response.data;
  }

  async generateUploadUrls(files: any[]) {
    const response = await productApi.post('/api/v1/products/upload-urls', { files });
    return response.data;
  }

  async uploadImagesToS3(uploadUrl: string, file: File) {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
    return response.data;
  }

  async getCategories() {
    const response = await productApi.get('/api/v1/categories');
    return response.data;
  }
}

export const productService = new ProductService();
export default productService;
