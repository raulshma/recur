import { apiClient } from './client';
import { API_CONFIG, API_ENDPOINTS } from '@/constants/ApiConfig';
import { processApiError } from './errorHandler';

/**
 * Result of an API connectivity test
 */
export interface ApiTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
  error?: any;
}

/**
 * Test API connectivity by making a request to the health endpoint
 * @returns Promise with the test result
 */
export const testApiConnectivity = async (): Promise<ApiTestResult> => {
  const startTime = Date.now();
  
  try {
    // Make a request to the health endpoint
    const response = await apiClient.get(API_ENDPOINTS.SYSTEM.HEALTH, {
      timeout: 5000, // Short timeout for quick feedback
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `API connection successful (${responseTime}ms)`,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const enhancedError = processApiError(error);
    
    return {
      success: false,
      message: `API connection failed: ${enhancedError.message}`,
      responseTime,
      statusCode: enhancedError.statusCode,
      error: enhancedError,
    };
  }
};

/**
 * Test API authentication by making a request to the current user endpoint
 * @returns Promise with the test result
 */
export const testApiAuthentication = async (): Promise<ApiTestResult> => {
  const startTime = Date.now();
  
  try {
    // Make a request to the current user endpoint
    const response = await apiClient.get(API_ENDPOINTS.AUTH.CURRENT_USER, {
      timeout: 5000, // Short timeout for quick feedback
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `Authentication successful (${responseTime}ms)`,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const enhancedError = processApiError(error);
    
    // If we get a 401, that's expected when not authenticated
    if (enhancedError.statusCode === 401) {
      return {
        success: true,
        message: 'Authentication check successful (not authenticated)',
        responseTime,
        statusCode: 401,
      };
    }
    
    return {
      success: false,
      message: `Authentication check failed: ${enhancedError.message}`,
      responseTime,
      statusCode: enhancedError.statusCode,
      error: enhancedError,
    };
  }
};

/**
 * Get information about the current API configuration
 * @returns Object with API configuration information
 */
export const getApiConfigInfo = () => {
  return {
    environment: API_CONFIG.ENV,
    apiUrl: API_CONFIG.API_URL,
    timeout: API_CONFIG.TIMEOUT,
    retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
    enableLogging: API_CONFIG.ENABLE_LOGGING,
  };
};