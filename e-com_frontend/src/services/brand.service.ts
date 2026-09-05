import axios from 'axios';

const WISHLIST_REVIEW_API_BASE_URL = import.meta.env.VITE_WISHLIST_REVIEW_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://o3mvptfnyh.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const brandApi = axios.create({
  baseURL: WISHLIST_REVIEW_API_BASE_URL,
});

brandApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Brand {
  brandId: string;
  displayId?: string; // Human-readable reference ID
  name: string;
  logoUrl?: string;
  description?: string;
  createdAt: string;
}

class BrandService {
  async getAllBrands(): Promise<Brand[]> {
    try {
      const response = await brandApi.get('/api/v1/brands');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  async getBrandById(brandId: string): Promise<Brand | null> {
    try {
      const response = await brandApi.get(`/api/v1/brands/${brandId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching brand by id:', error);
      return null;
    }
  }

  async createBrand(name: string, logoUrl?: string, description?: string): Promise<Brand> {
    const response = await brandApi.post('/api/v1/brands', {
      name,
      logoUrl,
      description,
    });
    return response.data.data;
  }

  async updateBrand(brandId: string, name: string, logoUrl?: string, description?: string): Promise<Brand> {
    const response = await brandApi.put(`/api/v1/brands/${brandId}`, {
      name,
      logoUrl,
      description,
    });
    return response.data.data;
  }

  async deleteBrand(brandId: string): Promise<void> {
    await brandApi.delete(`/api/v1/brands/${brandId}`);
  }
}

export const brandService = new BrandService();
export default brandService;
