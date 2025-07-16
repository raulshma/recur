import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ConvertedAmount, CurrencyDisplayOptions, CurrencyConversionResult, ExchangeRatesResponse } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
];

// Enhanced currency formatting utility with conversion support
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  convertedAmount?: ConvertedAmount
): string {
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    // If conversion data is provided and currencies differ, show converted amount
    if (convertedAmount && convertedAmount.originalCurrency !== convertedAmount.convertedCurrency) {
      const convertedFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: convertedAmount.convertedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount.convertedAmount);
      
      return convertedFormatted;
    }

    return formatted;
  } catch (error) {
    // Fallback for unsupported currencies
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

// Format converted currency with display options
export function formatConvertedCurrency(
  convertedAmount: ConvertedAmount,
  options: CurrencyDisplayOptions = {}
): string {
  const {
    showOriginal = false,
    showConversionRate = false,
    showTimestamp = false,
    compact = false
  } = options;

  try {
    // Format the converted amount
    const convertedFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: convertedAmount.convertedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount.convertedAmount);

    // If compact mode or currencies are the same, just return the converted amount
    if (compact || convertedAmount.originalCurrency === convertedAmount.convertedCurrency) {
      return convertedFormatted;
    }

    let result = convertedFormatted;

    // Add original amount if requested
    if (showOriginal) {
      const originalFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: convertedAmount.originalCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount.originalAmount);
      
      result += ` (${originalFormatted})`;
    }

    // Add conversion rate if requested
    if (showConversionRate) {
      result += ` @ ${convertedAmount.exchangeRate.toFixed(4)}`;
    }

    // Add timestamp if requested and rate is stale
    if (showTimestamp && convertedAmount.isStale) {
      const timeAgo = getTimeAgo(convertedAmount.timestamp);
      result += ` (${timeAgo})`;
    }

    return result;
  } catch (error) {
    // Fallback formatting
    const convertedSymbol = getCurrencySymbol(convertedAmount.convertedCurrency);
    const originalSymbol = getCurrencySymbol(convertedAmount.originalCurrency);
    
    let result = `${convertedSymbol}${convertedAmount.convertedAmount.toFixed(2)}`;
    
    if (showOriginal && !compact) {
      result += ` (${originalSymbol}${convertedAmount.originalAmount.toFixed(2)})`;
    }
    
    return result;
  }
}

// Enhanced currency symbol getter with conversion display support
export function getCurrencySymbol(currency: string, includeCode: boolean = false): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
  const symbol = currencyInfo?.symbol || currency;
  
  if (includeCode && currencyInfo) {
    return `${symbol} (${currency})`;
  }
  
  return symbol;
}

// Get currency display name
export function getCurrencyDisplayName(currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
  return currencyInfo?.label || currency;
}

// Utility function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// Currency conversion API utilities
const API_BASE_URL = '/api';

// Convert currency amount
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<CurrencyConversionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/currency/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount,
        fromCurrency,
        toCurrency
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      rateTimestamp: new Date(result.rateTimestamp)
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw new Error('Failed to convert currency');
  }
}

// Get current exchange rates
export async function getExchangeRates(
  baseCurrency: string,
  targetCurrencies?: string[]
): Promise<ExchangeRatesResponse> {
  try {
    const params = new URLSearchParams({ baseCurrency });
    if (targetCurrencies && targetCurrencies.length > 0) {
      params.append('currencies', targetCurrencies.join(','));
    }

    const response = await fetch(`${API_BASE_URL}/currency/rates?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      timestamp: new Date(result.timestamp)
    };
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw new Error('Failed to fetch exchange rates');
  }
}

// Batch convert multiple amounts
export async function batchConvertCurrency(
  conversions: Array<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }>
): Promise<CurrencyConversionResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/currency/convert/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ conversions })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();
    return results.map((result: any) => ({
      ...result,
      rateTimestamp: new Date(result.rateTimestamp)
    }));
  } catch (error) {
    console.error('Batch currency conversion failed:', error);
    throw new Error('Failed to convert currencies');
  }
}

// Check if currency conversion is needed
export function needsCurrencyConversion(
  subscriptionCurrency: string,
  userCurrency: string
): boolean {
  return subscriptionCurrency !== userCurrency;
}

// Create ConvertedAmount object from conversion result
export function createConvertedAmount(
  originalAmount: number,
  originalCurrency: string,
  conversionResult: CurrencyConversionResult
): ConvertedAmount {
  const rateAge = new Date().getTime() - new Date(conversionResult.rateTimestamp).getTime();
  const isStale = rateAge > 24 * 60 * 60 * 1000; // 24 hours

  return {
    originalAmount,
    originalCurrency,
    convertedAmount: conversionResult.convertedAmount,
    convertedCurrency: conversionResult.toCurrency,
    exchangeRate: conversionResult.exchangeRate,
    isStale,
    timestamp: new Date(conversionResult.rateTimestamp)
  };
}