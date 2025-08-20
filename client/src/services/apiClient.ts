import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class ApiClient {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: any) => {
        return response;
      },
      (error: any) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<APIResponse<T>>(url, { params });
    const responseData = response.data as APIResponse<T>;
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }
    throw new Error(responseData.error || 'Failed to fetch data');
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<APIResponse<T>>(url, data);
    const responseData = response.data as APIResponse<T>;
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }
    throw new Error(responseData.error || 'Failed to post data');
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<APIResponse<T>>(url, data);
    const responseData = response.data as APIResponse<T>;
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }
    throw new Error(responseData.error || 'Failed to update data');
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete<APIResponse<T>>(url);
    const responseData = response.data as APIResponse<T>;
    if (responseData.success) {
      return responseData.data as T;
    }
    throw new Error(responseData.error || 'Failed to delete data');
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<APIResponse<T>>(url, data);
    const responseData = response.data as APIResponse<T>;
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }
    throw new Error(responseData.error || 'Failed to patch data');
  }
}

export const apiClient = new ApiClient();