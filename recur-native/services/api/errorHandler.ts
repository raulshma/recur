import { ApiError } from '@/types';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '@/constants/ApiConfig';

/**
 * Error types for better error handling
 */
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Enhanced API error with additional context
 */
export interface EnhancedApiError extends ApiError {
  type: ApiErrorType;
  isOffline?: boolean;
  isTimeout?: boolean;
  isServerError?: boolean;
  retryable?: boolean;
  originalError?: any;
}

/**
 * Check if the device is currently online
 * @returns Promise<boolean> True if online, false otherwise
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected === true;
};

/**
 * Process an error from an API call and convert it to a standardized format
 * @param error The error object from the API call
 * @returns EnhancedApiError A standardized error object
 */
export const processApiError = (error: any): EnhancedApiError => {
  // Check if it's already our enhanced error type
  if (error.type && Object.values(ApiErrorType).includes(error.type)) {
    return error as EnhancedApiError;
  }

  // Default error structure
  const enhancedError: EnhancedApiError = {
    message: 'An unexpected error occurred',
    statusCode: 0,
    type: ApiErrorType.UNKNOWN,
    retryable: false,
    originalError: error,
  };

  // Handle network connectivity errors
  if (error.isOffline || error.message === 'Network Error' || error.message?.includes('network')) {
    enhancedError.type = ApiErrorType.NETWORK;
    enhancedError.message = 'No internet connection. Please check your network settings and try again.';
    enhancedError.isOffline = true;
    enhancedError.retryable = true;
    return enhancedError;
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    enhancedError.type = ApiErrorType.TIMEOUT;
    enhancedError.message = 'Request timed out. Please try again.';
    enhancedError.isTimeout = true;
    enhancedError.retryable = true;
    return enhancedError;
  }

  // Handle axios error responses
  if (error.response) {
    enhancedError.statusCode = error.response.status;

    // Get error message from response if available
    if (error.response.data?.message) {
      enhancedError.message = error.response.data.message;
    }

    // Get validation errors if available
    if (error.response.data?.errors) {
      enhancedError.errors = error.response.data.errors;
    }

    // Categorize by status code
    switch (error.response.status) {
      case 401:
        enhancedError.type = ApiErrorType.UNAUTHORIZED;
        enhancedError.message = enhancedError.message || 'Your session has expired. Please log in again.';
        enhancedError.retryable = false;
        break;
      case 403:
        enhancedError.type = ApiErrorType.FORBIDDEN;
        enhancedError.message = enhancedError.message || 'You do not have permission to perform this action.';
        enhancedError.retryable = false;
        break;
      case 404:
        enhancedError.type = ApiErrorType.NOT_FOUND;
        enhancedError.message = enhancedError.message || 'The requested resource was not found.';
        enhancedError.retryable = false;
        break;
      case 422:
        enhancedError.type = ApiErrorType.VALIDATION;
        enhancedError.message = enhancedError.message || 'Validation error. Please check your input.';
        enhancedError.retryable = false;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        enhancedError.type = ApiErrorType.SERVER;
        enhancedError.message = enhancedError.message || 'Server error. Please try again later.';
        enhancedError.isServerError = true;
        enhancedError.retryable = true;
        break;
      default:
        enhancedError.type = ApiErrorType.UNKNOWN;
        enhancedError.retryable = false;
    }
  } else if (error.request) {
    // Request was made but no response received
    enhancedError.type = ApiErrorType.NETWORK;
    enhancedError.message = 'No response from server. Please check your connection and try again.';
    enhancedError.retryable = true;
  }

  return enhancedError;
};

/**
 * Retry a failed API call with exponential backoff
 * @param fn The function to retry
 * @param retries Maximum number of retries
 * @param retryDelay Base delay between retries in ms
 * @param shouldRetry Function to determine if retry should be attempted
 * @returns Promise with the result of the function or the last error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = API_CONFIG.RETRY_ATTEMPTS,
  retryDelay: number = API_CONFIG.RETRY_DELAY,
  shouldRetry: (error: any) => boolean = (error) => {
    const enhancedError = processApiError(error);
    return enhancedError.retryable === true;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Check if we should retry
    if (retries > 0 && shouldRetry(error)) {
      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, API_CONFIG.RETRY_ATTEMPTS - retries);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with one less retry attempt
      return retryWithBackoff(fn, retries - 1, retryDelay, shouldRetry);
    }
    
    // No more retries or shouldn't retry, throw the error
    throw error;
  }
}

/**
 * Get a user-friendly error message from an API error
 * @param error The error object
 * @returns A user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  const enhancedError = processApiError(error);
  
  // Return the enhanced error message
  return enhancedError.message;
};