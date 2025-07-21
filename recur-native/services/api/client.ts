import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';
import { ApiError, ApiResponse } from '@/types';
import * as SecureStore from 'expo-secure-store';

// Store reference for token refresh
let authStoreRef: any = null;

export const setAuthStoreRef = (store: any) => {
  authStoreRef = store;
};

// Create the base axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return client;
};

export const apiClient = createApiClient();

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token from secure storage:', error);
    }
    
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

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (__DEV__) {
      console.error('[API Response Error]', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Use auth store for token refresh if available
        if (authStoreRef) {
          const newToken = await authStoreRef.getState().refreshToken();
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request
          return apiClient(originalRequest);
        } else {
          // Fallback to direct token refresh
          const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (refreshToken) {
            // Attempt to refresh the token
            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}/auth/refresh`,
              { refreshToken },
              { timeout: API_CONFIG.TIMEOUT }
            );
            
            const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;
            
            // Store new tokens
            await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, newToken);
            await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear auth state
        if (authStoreRef) {
          // Use auth store to handle logout
          await authStoreRef.getState().logout();
        } else {
          // Fallback: clear stored tokens
          await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        }
        
        console.warn('Token refresh failed, user needs to login again');
      }
    }

    // Transform error to our ApiError format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 0,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

// Generic API request wrapper with retry logic
export const apiRequest = async <T>(
  config: AxiosRequestConfig,
  retryCount = 0
): Promise<T> => {
  try {
    const response = await apiClient(config);
    
    // Handle different response formats
    if (response.data?.data !== undefined) {
      // Wrapped response format
      return response.data.data;
    }
    
    // Direct response format
    return response.data;
  } catch (error) {
    // Retry logic for network errors
    if (
      retryCount < API_CONFIG.RETRY_ATTEMPTS &&
      (error as ApiError).statusCode >= 500
    ) {
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1))
      );
      return apiRequest<T>(config, retryCount + 1);
    }
    
    throw error;
  }
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