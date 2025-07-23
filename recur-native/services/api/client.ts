import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';
import { ApiError, ApiResponse } from '@/types';
import * as SecureStore from 'expo-secure-store';
import { setupTokenRefreshInterceptor } from './tokenRefreshInterceptor';
import { processApiError, checkNetworkConnectivity, retryWithBackoff } from './errorHandler';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

/**
 * Create the base axios instance with environment-specific configuration
 * @returns AxiosInstance configured for the current environment
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.API_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': API_CONFIG.ENV === 'development' ? 'dev' : require('../../package.json').version,
      'X-Client-Platform': Platform.OS,
    },
    // Add additional options based on environment
    ...(API_CONFIG.ENV === 'development' ? {
      validateStatus: status => status < 500, // Don't reject on 4xx errors in dev for easier debugging
    } : {}),
  });

  return client;
};

export const apiClient = createApiClient();

// Set up token refresh interceptor
setupTokenRefreshInterceptor(apiClient);

// Request interceptor for logging
apiClient.interceptors.request.use(
  async (config) => {
    // Add request timestamp for debugging
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Only log in development or if logging is enabled
    if (API_CONFIG.ENABLE_LOGGING) {
      
    }
    return response;
  },
  async (error) => {
    // Log error details if logging is enabled
    if (API_CONFIG.ENABLE_LOGGING) {
      console.error('[API Response Error]', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    // Process the error to our enhanced format
    const enhancedError = processApiError(error);
    
    // Return the enhanced error
    return Promise.reject(enhancedError);
  }
);

/**
 * Enhanced API request wrapper with retry logic and error handling
 * @param config Axios request configuration
 * @returns Promise with the response data
 */
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  // Check network connectivity before making the request
  const isConnected = await checkNetworkConnectivity();
  if (!isConnected) {
    throw {
      isOffline: true,
      message: 'No internet connection. Please check your network settings and try again.',
    };
  }
  
  // Use retry with backoff for the actual request
  return retryWithBackoff(async () => {
    const response = await apiClient(config);
    
    // Handle different response formats
    if (response.data?.data !== undefined) {
      // Wrapped response format
      return response.data.data;
    }
    
    // Direct response format
    return response.data;
  });
};

// Convenience methods for common HTTP operations
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'GET', url, ...config }),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'POST', url, data, ...config }),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'PUT', url, data, ...config }),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'PATCH', url, data, ...config }),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'DELETE', url, ...config }),
};

// Helper function to handle file uploads
export const uploadFile = async (
  url: string,
  file: any,
  onUploadProgress?: (progressEvent: any) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const config: AxiosRequestConfig = {
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }
  
  return apiRequest(config);
};

// Helper function to check if error is an API error
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.statusCode === 'number' && typeof error.message === 'string';
};

// Helper function to get error message from various error types
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};