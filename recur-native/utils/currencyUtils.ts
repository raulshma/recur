import { cacheStorage } from '@/services/storage';
import { CURRENCIES } from '@/constants/config';
import { onlineManager } from '@tanstack/react-query';

// Interface for exchange rate data
interface ExchangeRateData {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

// Cache exchange rates for 1 hour by default
const EXCHANGE_RATE_CACHE_MINUTES = 60;

// Fallback exchange rates for offline mode
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  'USD': {
    'EUR': 0.85,
    'GBP': 0.75,
    'CAD': 1.25,
    'AUD': 1.35,
    'JPY': 110.0,
  },
  'EUR': {
    'USD': 1.18,
    'GBP': 0.88,
    'CAD': 1.47,
    'AUD': 1.59,
    'JPY': 129.5,
  },
  'GBP': {
    'USD': 1.33,
    'EUR': 1.14,
    'CAD': 1.67,
    'AUD': 1.80,
    'JPY': 147.0,
  },
};

/**
 * Fetch exchange rates from API or cache with improved error handling and offline support
 * @param baseCurrency The base currency to convert from
 * @returns Exchange rate data
 */
export const getExchangeRates = async (baseCurrency = 'USD'): Promise<ExchangeRateData | null> => {
  try {
    // Try to get from cache first
    const cachedRates = await cacheStorage.getCacheData<ExchangeRateData>(`exchange_rates_${baseCurrency}`);
    
    if (cachedRates) {
      return cachedRates;
    }
    
    // Check if we're online before making API call
    if (!onlineManager.isOnline()) {
      console.log('Device is offline, using fallback exchange rates');
      return getFallbackExchangeRates(baseCurrency);
    }
    
    // Fetch from API if not in cache
    // Use a timeout promise instead of AbortSignal to avoid type issues
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    const fetchPromise = fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Add timestamp if not present
    const typedData = data as ExchangeRateData;
    if (!typedData.timestamp) {
      typedData.timestamp = Date.now();
    }
    
    // Cache the results
    await cacheStorage.setCacheData(`exchange_rates_${baseCurrency}`, data, EXCHANGE_RATE_CACHE_MINUTES);
    
    return data as ExchangeRateData;
  } catch (error) {
    console.error('Failed to get exchange rates:', error);
    
    // Try to get from cache even if expired as fallback
    try {
      const expiredCache = await storage.getObject<ExchangeRateData>(`cache_exchange_rates_${baseCurrency}`);
      if (expiredCache) {
        console.log('Using expired exchange rate cache as fallback');
        return expiredCache;
      }
    } catch (cacheError) {
      console.error('Failed to get expired cache:', cacheError);
    }
    
    // Use hardcoded fallback rates as last resort
    return getFallbackExchangeRates(baseCurrency);
  }
};

/**
 * Get fallback exchange rates when API is unavailable
 * @param baseCurrency Base currency code
 * @returns Fallback exchange rate data
 */
const getFallbackExchangeRates = (baseCurrency: string): ExchangeRateData => {
  // Use hardcoded fallback rates or generate approximate ones
  const fallbackRates = FALLBACK_RATES[baseCurrency] || {};
  
  // Add 1:1 rate for the base currency itself
  fallbackRates[baseCurrency] = 1;
  
  // Add approximate rates for any missing currencies
  CURRENCIES.forEach(currency => {
    if (currency.code !== baseCurrency && !fallbackRates[currency.code]) {
      // Use a reasonable default if we don't have a specific fallback
      fallbackRates[currency.code] = 1;
    }
  });
  
  return {
    rates: fallbackRates,
    base: baseCurrency,
    timestamp: Date.now(),
  };
};

/**
 * Convert amount from one currency to another with improved error handling
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount or null if conversion failed
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number; timestamp: number; isStale: boolean } | null> => {
  // No conversion needed if currencies are the same
  if (fromCurrency === toCurrency) {
    return { 
      convertedAmount: amount, 
      exchangeRate: 1,
      timestamp: Date.now(),
      isStale: false
    };
  }
  
  try {
    const ratesData = await getExchangeRates(fromCurrency);
    
    if (!ratesData || !ratesData.rates) {
      throw new Error('Exchange rate data not available');
    }
    
    const exchangeRate = ratesData.rates[toCurrency];
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    const convertedAmount = amount * exchangeRate;
    const isStale = areExchangeRatesStale(ratesData.timestamp);
    
    return {
      convertedAmount,
      exchangeRate,
      timestamp: ratesData.timestamp,
      isStale
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    
    // Try direct conversion as fallback
    try {
      const fallbackRates = getFallbackExchangeRates(fromCurrency);
      const exchangeRate = fallbackRates.rates[toCurrency] || 1;
      
      return {
        convertedAmount: amount * exchangeRate,
        exchangeRate,
        timestamp: Date.now(),
        isStale: true
      };
    } catch (fallbackError) {
      console.error('Fallback conversion failed:', fallbackError);
      return null;
    }
  }
};

/**
 * Batch convert multiple amounts to target currency with optimized performance
 * @param items Array of items with amount and currency
 * @param targetCurrency Target currency code
 * @returns Array of converted items
 */
export const batchConvertCurrency = async <T extends { amount: number; currency: string }>(
  items: T[],
  targetCurrency: string
): Promise<(T & { convertedAmount: number; exchangeRate: number; timestamp: number; isStale: boolean })[]> => {
  // Group items by currency to minimize API calls
  const currencyGroups: Record<string, T[]> = {};
  
  items.forEach(item => {
    if (item.currency) {
      if (!currencyGroups[item.currency]) {
        currencyGroups[item.currency] = [];
      }
      // Use optional chaining and nullish coalescing to safely access and update
      currencyGroups[item.currency]?.push(item);
    }
  });
  
  // Convert each currency group
  const results: (T & { convertedAmount: number; exchangeRate: number; timestamp: number; isStale: boolean })[] = [];
  
  // Prefetch all needed exchange rates in parallel
  const uniqueCurrencies = Object.keys(currencyGroups).filter(c => c !== targetCurrency);
  
  // Prefetch exchange rates in parallel
  const ratesPromises = uniqueCurrencies.map(currency => getExchangeRates(currency));
  const ratesResults = await Promise.allSettled(ratesPromises);
  
  // Create a map of currency to exchange rate data
  const exchangeRatesMap = new Map<string, ExchangeRateData>();
  
  uniqueCurrencies.forEach((currency, index) => {
    const rateResult = ratesResults[index];
    if (rateResult && rateResult.status === 'fulfilled' && 'value' in rateResult && rateResult.value) {
      exchangeRatesMap.set(currency, rateResult.value);
    }
  });
  
  // Process each currency group
  await Promise.all(
    Object.entries(currencyGroups).map(async ([currency, groupItems]) => {
      // Skip conversion if currency matches target
      if (currency === targetCurrency) {
        groupItems.forEach(item => {
          results.push({
            ...item,
            convertedAmount: item.amount,
            exchangeRate: 1,
            timestamp: Date.now(),
            isStale: false
          });
        });
        return;
      }
      
      // Get exchange rates for this currency
      const ratesData = exchangeRatesMap.get(currency) || await getExchangeRates(currency);
      
      if (!ratesData || !ratesData.rates) {
        // Fallback: keep original amount if conversion fails
        groupItems.forEach(item => {
          results.push({
            ...item,
            convertedAmount: item.amount,
            exchangeRate: 1,
            timestamp: Date.now(),
            isStale: true
          });
        });
        return;
      }
      
      const exchangeRate = ratesData.rates[targetCurrency] || 1;
      const isStale = areExchangeRatesStale(ratesData.timestamp);
      
      // Convert all items in this group
      groupItems.forEach(item => {
        results.push({
          ...item,
          convertedAmount: item.amount * exchangeRate,
          exchangeRate,
          timestamp: ratesData.timestamp,
          isStale
        });
      });
    })
  );
  
  return results;
};

/**
 * Format currency amount according to locale with improved formatting options
 * @param amount Amount to format
 * @param currencyCode Currency code
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  options?: {
    locale?: string;
    compact?: boolean;
    showSymbol?: boolean;
    precision?: number;
  }
): string => {
  const {
    locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US',
    compact = false,
    showSymbol = true,
    precision,
  } = options || {};
  
  try {
    // Determine appropriate precision
    const defaultPrecision = currencyCode === 'JPY' ? 0 : 2;
    const minFractionDigits = precision !== undefined ? precision : defaultPrecision;
    const maxFractionDigits = precision !== undefined ? precision : defaultPrecision;
    
    // Format with Intl
    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currencyCode : undefined,
      currencyDisplay: 'symbol',
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
      notation: compact ? 'compact' : 'standard',
      compactDisplay: 'short',
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting failed:', error);
    
    // Fallback formatting
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    const symbol = showSymbol ? (currency?.symbol || currencyCode) : '';
    const formattedAmount = amount.toFixed(currencyCode === 'JPY' ? 0 : 2);
    
    return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
  }
};

/**
 * Get currency symbol from currency code
 * @param currencyCode Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

/**
 * Check if exchange rates are stale
 * @param timestamp Timestamp of the exchange rate data
 * @param maxAgeMinutes Optional maximum age in minutes
 * @returns Boolean indicating if rates are stale
 */
export const areExchangeRatesStale = (timestamp: number, maxAgeMinutes = EXCHANGE_RATE_CACHE_MINUTES): boolean => {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;
  
  return now - timestamp > maxAge;
};

/**
 * Calculate annual cost from amount and billing cycle
 * @param amount Amount per billing cycle
 * @param billingCycle Billing cycle ID
 * @returns Annual cost
 */
export const calculateAnnualCost = (amount: number, billingCycle: number): number => {
  // Billing cycle multipliers
  const multipliers: Record<number, number> = {
    1: 52,    // Weekly
    2: 12,    // Monthly
    3: 4,     // Quarterly
    4: 2,     // Semi-Annually
    5: 1,     // Annually
    6: 0.5,   // Biannually
  };
  
  const multiplier = multipliers[billingCycle] || 1;
  return amount * multiplier;
};

/**
 * Calculate monthly cost from amount and billing cycle
 * @param amount Amount per billing cycle
 * @param billingCycle Billing cycle ID
 * @returns Monthly cost
 */
export const calculateMonthlyCost = (amount: number, billingCycle: number): number => {
  // Monthly equivalents
  const multipliers: Record<number, number> = {
    1: 4.33,  // Weekly (52/12)
    2: 1,     // Monthly
    3: 1/3,   // Quarterly
    4: 1/6,   // Semi-Annually
    5: 1/12,  // Annually
    6: 1/24,  // Biannually
  };
  
  const multiplier = multipliers[billingCycle] || 1;
  return amount * multiplier;
};

/**
 * Get all available currencies
 * @returns Array of currency objects
 */
export const getAllCurrencies = () => {
  return [...CURRENCIES];
};

// Export storage reference for use in this module
import { storage } from '@/services/storage';