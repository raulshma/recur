import { useState, useCallback } from 'react';
import { CurrencyConversionError } from '../api/currency';

export interface CurrencyErrorState {
  error: string | null;
  isRetrying: boolean;
  retryCount: number;
  lastRetryAt: Date | null;
}

export interface UseCurrencyErrorHandlerReturn {
  errorState: CurrencyErrorState;
  handleError: (error: unknown) => void;
  clearError: () => void;
  canRetry: boolean;
  retry: (retryFn: () => Promise<void>) => Promise<void>;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export function useCurrencyErrorHandler(): UseCurrencyErrorHandlerReturn {
  const [errorState, setErrorState] = useState<CurrencyErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryAt: null
  });

  const handleError = useCallback((error: unknown) => {
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof CurrencyConversionError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          errorMessage = 'Network connection failed. Please check your internet connection.';
          break;
        case 'SERVICE_UNAVAILABLE':
          errorMessage = 'Currency conversion service is temporarily unavailable. Please try again later.';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid currency conversion request. Please check your input.';
          break;
        case 'SERVER_ERROR':
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Currency conversion failed';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    setErrorState(prev => ({
      ...prev,
      error: errorMessage,
      isRetrying: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryAt: null
    });
  }, []);

  const canRetry = errorState.retryCount < MAX_RETRY_ATTEMPTS && !errorState.isRetrying;

  const retry = useCallback(async (retryFn: () => Promise<void>) => {
    if (!canRetry) return;

    setErrorState(prev => ({
      ...prev,
      isRetrying: true
    }));

    try {
      // Add delay for exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, errorState.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      await retryFn();

      // Success - clear error state
      clearError();
    } catch (error) {
      setErrorState(prev => ({
        ...prev,
        error: prev.error, // Keep the original error message
        isRetrying: false,
        retryCount: prev.retryCount + 1,
        lastRetryAt: new Date()
      }));

      // If we've exceeded max retries, update the error message
      if (errorState.retryCount + 1 >= MAX_RETRY_ATTEMPTS) {
        handleError(new Error('Maximum retry attempts exceeded. Please try again later.'));
      }
    }
  }, [canRetry, errorState.retryCount, handleError, clearError]);

  return {
    errorState,
    handleError,
    clearError,
    canRetry,
    retry
  };
}

export function getCurrencyErrorMessage(error: unknown): string {
  if (error instanceof CurrencyConversionError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to currency service. Please check your internet connection.';
      case 'SERVICE_UNAVAILABLE':
        return 'Currency conversion service is temporarily unavailable.';
      case 'INVALID_REQUEST':
        return 'Invalid currency conversion request.';
      case 'SERVER_ERROR':
        return 'Currency service error. Please try again later.';
      default:
        return error.message || 'Currency conversion failed';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred during currency conversion';
}