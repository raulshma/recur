import { apiClient } from './client';
import type { CurrencyConversionResult, ExchangeRatesResponse } from '../types';

export interface ConvertCurrencyRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface BatchConvertRequest {
  conversions: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }[];
}

export interface BatchConvertResponse {
  results: CurrencyConversionResult[];
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  hasErrors: boolean;
  timestamp: string;
}

export class CurrencyConversionError extends Error {
  public code?: string;
  public statusCode?: number;
  public details?: any;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'CurrencyConversionError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const currencyApi = {
  /**
   * Convert a single amount from one currency to another
   */
  async convertCurrency(request: ConvertCurrencyRequest): Promise<CurrencyConversionResult> {
    try {
      const response = await apiClient.post<CurrencyConversionResult>('/currency/convert', request);
      
      // Check if the conversion returned a valid result
      if (!response.data.convertedAmount) {
        console.warn('Currency conversion returned no result');
      }
      
      return response.data;
    } catch (error: any) {
      // Handle different types of API errors
      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 400) {
          throw new CurrencyConversionError(
            errorData.error || 'Invalid conversion request',
            'INVALID_REQUEST',
            statusCode,
            errorData
          );
        } else if (statusCode === 503) {
          throw new CurrencyConversionError(
            'Currency conversion service is temporarily unavailable',
            'SERVICE_UNAVAILABLE',
            statusCode,
            errorData
          );
        } else if (statusCode >= 500) {
          throw new CurrencyConversionError(
            'Currency conversion service error',
            'SERVER_ERROR',
            statusCode,
            errorData
          );
        }
      } else if (error.request) {
        throw new CurrencyConversionError(
          'Network error - unable to reach currency service',
          'NETWORK_ERROR',
          undefined,
          error
        );
      }
      
      throw new CurrencyConversionError(
        error.message || 'Unknown currency conversion error',
        'UNKNOWN_ERROR',
        undefined,
        error
      );
    }
  },

  /**
   * Get current exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string, targetCurrencies?: string[]): Promise<ExchangeRatesResponse> {
    try {
      const params: Record<string, any> = { baseCurrency };
      if (targetCurrencies && targetCurrencies.length > 0) {
        params.targetCurrencies = targetCurrencies.join(',');
      }
      
      const response = await apiClient.get<ExchangeRatesResponse>('/currency/rates', params);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 400) {
          throw new CurrencyConversionError(
            errorData.error || 'Invalid exchange rate request',
            'INVALID_REQUEST',
            statusCode,
            errorData
          );
        } else if (statusCode === 503) {
          throw new CurrencyConversionError(
            'Exchange rate service is temporarily unavailable',
            'SERVICE_UNAVAILABLE',
            statusCode,
            errorData
          );
        }
      } else if (error.request) {
        throw new CurrencyConversionError(
          'Network error - unable to fetch exchange rates',
          'NETWORK_ERROR',
          undefined,
          error
        );
      }
      
      throw new CurrencyConversionError(
        error.message || 'Failed to fetch exchange rates',
        'UNKNOWN_ERROR',
        undefined,
        error
      );
    }
  },

  /**
   * Convert multiple amounts in a single request
   */
  async batchConvert(request: BatchConvertRequest): Promise<CurrencyConversionResult[]> {
    try {
      const response = await apiClient.post<BatchConvertResponse>('/currency/convert/batch', request);
      
      // Log warnings for any failed conversions
      if (response.data.hasErrors) {
        console.warn(`Batch conversion completed with ${response.data.failedConversions} failures out of ${response.data.totalConversions} conversions`);
      }
      
      return response.data.results;
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 400) {
          throw new CurrencyConversionError(
            errorData.error || 'Invalid batch conversion request',
            'INVALID_REQUEST',
            statusCode,
            errorData
          );
        } else if (statusCode === 503) {
          throw new CurrencyConversionError(
            'Currency conversion service is temporarily unavailable',
            'SERVICE_UNAVAILABLE',
            statusCode,
            errorData
          );
        }
      } else if (error.request) {
        throw new CurrencyConversionError(
          'Network error - unable to perform batch conversion',
          'NETWORK_ERROR',
          undefined,
          error
        );
      }
      
      throw new CurrencyConversionError(
        error.message || 'Batch conversion failed',
        'UNKNOWN_ERROR',
        undefined,
        error
      );
    }
  },

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<{ code: string; name: string; symbol: string }[]> {
    try {
      const response = await apiClient.get<{ code: string; name: string; symbol: string }[]>('/currency/supported');
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch supported currencies, using fallback list');
      // Return a basic fallback list of common currencies
      return [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
      ];
    }
  },

  /**
   * Check if currency conversion is available for a currency pair
   */
  async isConversionSupported(fromCurrency: string, toCurrency: string): Promise<{ supported: boolean; reason?: string }> {
    try {
      const response = await apiClient.get<{ supported: boolean; reason?: string }>('/currency/supported-pair', {
        fromCurrency,
        toCurrency
      });
      return response.data;
    } catch (error: any) {
      console.warn('Failed to check currency pair support, assuming supported');
      return { supported: true, reason: 'Unable to verify support - assuming available' };
    }
  }
};