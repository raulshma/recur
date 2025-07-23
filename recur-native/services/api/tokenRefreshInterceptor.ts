import { AxiosInstance } from 'axios';
import { authStorage } from '@/services/storage';
import { useAuthStore } from '@/store/authStore';
import { isTokenExpiring } from '@/utils/tokenUtils';
import NetInfo from '@react-native-community/netinfo';
import { getAuthStoreRef } from './authStoreRef';

/**
 * Sets up token refresh interceptors for the API client
 * @param apiClient Axios instance to add interceptors to
 */
export const setupTokenRefreshInterceptor = (apiClient: AxiosInstance) => {
  // Get auth store state with proper typing
  const getAuthState = () => {
    const state = getAuthStoreRef()();
    return {
      refreshToken: async () => { /* Implementation will be provided by the actual store */ },
      logout: async () => { /* Implementation will be provided by the actual store */ },
      ...state
    };
  };

  // Response interceptor for handling 401 errors and token refresh
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Only attempt refresh once to prevent infinite loops
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Get auth store state
          const authState = getAuthState();
          
          // Refresh token
          await authState.refreshToken();
          
          // Get new token
          const authData = await authStorage.getAuthData();
          if (!authData?.token) {
            throw new Error('Failed to refresh token');
          }
          
          // Update request with new token
          originalRequest.headers.Authorization = `Bearer ${authData.token}`;
          
          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Token refresh failed, logout user
          const authState = getAuthState();
          await authState.logout();
          
          // Propagate error
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Request interceptor to check token expiration before requests
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        
        // If offline, reject the request with a specific error
        if (!netInfo.isConnected) {
          return Promise.reject({
            isOffline: true,
            message: 'No internet connection',
          });
        }
        
        // Skip token check for auth endpoints
        const isAuthEndpoint = config.url?.includes('/auth/login') || 
                              config.url?.includes('/auth/refresh');
        
        if (isAuthEndpoint) {
          return config;
        }
        
        // Check if token is about to expire
        const authData = await authStorage.getAuthData();
        if (authData?.token && authData?.expiresAt) {
          const isExpiring = isTokenExpiring(authData.expiresAt);
          
          if (isExpiring) {
            // Token is expiring, refresh it
            const authState = getAuthState();
            await authState.refreshToken();
            
            // Get new token
            const newAuthData = await authStorage.getAuthData();
            if (newAuthData?.token) {
              // Update request with new token
              config.headers.Authorization = `Bearer ${newAuthData.token}`;
            }
          } else {
            // Token is valid, use it
            config.headers.Authorization = `Bearer ${authData.token}`;
          }
        }
      } catch (error) {
        console.error('Error in token refresh interceptor:', error);
      }
      
      return config;
    }
  );
};