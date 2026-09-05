import axios from 'axios';

const CATEGORY_API_BASE_URL = import.meta.env.VITE_CATEGORY_API_BASE_URL || 'https://qb6ffmz4e3.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const categoryApi = axios.create({
  baseURL: CATEGORY_API_BASE_URL,
});

categoryApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// We can intercept response to handle token expiration/unauthorized errors.
categoryApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Unauthorized or session expired. Remove tokens and redirect to login.
      localStorage.removeItem('natcart_access_token');
      localStorage.removeItem('natcart_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CategoryImagePayload {
  key: string;
  url: string;
}

export interface CategoryPayload {
  name: string;
  description: string;
  image?: CategoryImagePayload | null;
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  featured?: boolean | string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

class CategoryService {
  async getCategories(params: GetCategoriesParams) {
    const queryParams: any = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params.featured !== undefined && params.featured !== 'ALL') {
      queryParams.featured = params.featured === 'true' || params.featured === true;
    }
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.order) queryParams.order = params.order;

    const response = await categoryApi.get('/api/v1/categories', { params: queryParams });
    return response.data;
  }

  async getCategoryById(id: string) {
    const response = await categoryApi.get(`/api/v1/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CategoryPayload) {
    const response = await categoryApi.post('/api/v1/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: CategoryPayload) {
    const response = await categoryApi.put(`/api/v1/categories/${id}`, data);
    return response.data;
  }

  async generateUploadUrl(file: File) {
    const response = await categoryApi.post('/api/v1/categories/upload-url', {
      fileName: file.name,
      contentType: file.type,
    });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  }

  async uploadImageToS3(uploadUrl: string, file: File) {
    // Do NOT send Authorization headers to S3.
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
    return response.data;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
