import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

if(!API_BASE_URL) {
  throw new Error('API_BASE_URL is not set');
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        // Transform error to our ApiError format
        const responseData = error.response?.data as any;
        const apiError: ApiError = {
          message: responseData?.message || error.message || 'An error occurred',
          errors: responseData?.errors,
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  public get<T>(url: string, params?: Record<string, any>) {
    return this.client.get<T>(url, { params });
  }

  public post<T>(url: string, data?: any) {
    return this.client.post<T>(url, data);
  }

  public put<T>(url: string, data?: any) {
    return this.client.put<T>(url, data);
  }

  public delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const apiClient = new ApiClient(); 