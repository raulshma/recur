import type { ApiError } from '../types';

/**
 * Extracts a user-friendly error message from various error types
 * that might be thrown during authentication
 */
export const getAuthErrorMessage = (error: unknown): string => {
  // Handle ApiError type (from our API client)
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as ApiError;
    
    // If we have field-specific errors, format them nicely
    if (apiError.errors && Object.keys(apiError.errors).length > 0) {
      const errorMessages = Object.entries(apiError.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      
      return errorMessages;
    }
    
    // Otherwise return the main message
    return apiError.message;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Handles authentication errors by setting the error state and focusing on the error message
 */
export const handleAuthError = (
  error: unknown, 
  setErrorFn: (message: string) => void,
  errorRef: React.RefObject<HTMLElement>
): void => {
  // Set the error message
  setErrorFn(getAuthErrorMessage(error));
  
  // Focus the error message for accessibility
  setTimeout(() => {
    errorRef.current?.focus();
  }, 100);
};