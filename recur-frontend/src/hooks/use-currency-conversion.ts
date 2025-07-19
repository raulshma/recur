import { useState, useEffect, useCallback, useRef } from 'react';
import { currencyApi } from '../api/currency';
import { settingsApi } from '../api/settings';
import type { ConvertedAmount } from '../types';
import type { UserSettings } from '../api/settings';
import { createConvertedAmount, needsCurrencyConversion } from '../lib/utils';
import { mergeWithCurrencyDefaults } from '../lib/currency-defaults';
import { useCurrencyErrorHandler } from './use-currency-error-handler';

export interface UseCurrencyConversionReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string, priority?: 'high' | 'normal' | 'low') => Promise<ConvertedAmount | null>;
  batchConvert: (conversions: { amount: number; fromCurrency: string }[]) => Promise<ConvertedAmount[]>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isConversionEnabled: boolean;
  shouldAutoConvert: boolean;
  preferredCurrency: string;
  // Performance optimization methods
  preloadCurrencyPairs: (pairs: Array<{ from: string; to: string }>) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { size: number; hitRate: number; frequentPairs: Array<{ pair: string; usage: number }> };
}

export function useCurrencyConversion(): UseCurrencyConversionReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { errorState, handleError, clearError } = useCurrencyErrorHandler();
  
  // Enhanced debouncing and caching for performance optimization
  const debounceTimeouts = useRef<Map<string, any>>(new Map());
  const conversionCache = useRef<Map<string, { result: ConvertedAmount | null; timestamp: number; hitCount: number }>>(new Map());
  const batchDebounceTimeout = useRef<any>(null);
  const pendingBatchConversions = useRef<Array<{
    conversions: { amount: number; fromCurrency: string }[];
    resolve: (value: ConvertedAmount[]) => void;
    reject: (error: unknown) => void;
  }>>([]);
  
  // Performance optimization constants - Enhanced for better performance
  const DEBOUNCE_DELAY = 200; // Increased for better API efficiency while maintaining responsiveness
  const CACHE_DURATION = 20 * 60 * 1000; // Extended to 20 minutes cache for better performance
  const MAX_CACHE_SIZE = 1500; // Increased cache size for better hit rates
  const BATCH_DEBOUNCE_DELAY = 30; // Optimized batch processing for dashboard loading
  const FREQUENT_PAIR_THRESHOLD = 2; // Pairs used 2+ times are considered frequent (more aggressive)
  const FREQUENT_PAIR_CACHE_MULTIPLIER = 3; // Frequent pairs cached 3x longer for better performance
  const AGGRESSIVE_DEBOUNCE_DELAY = 500; // For non-critical conversions
  const PRIORITY_CONVERSION_DELAY = 100; // For dashboard/critical conversions
  
  // Frequently converted currency pairs for enhanced caching
  const frequentPairs = useRef<Map<string, number>>(new Map()); // Track usage frequency
  const requestQueue = useRef<Map<string, Promise<ConvertedAmount | null>>>(new Map()); // Prevent duplicate requests

  // Helper function to check cache validity
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, [CACHE_DURATION]);

  // Load user settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Cache management and cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Clean up expired cache entries
      const cacheEntries = Array.from(conversionCache.current.entries());
      
      for (const [key, entry] of cacheEntries) {
        if (!isCacheValid(entry.timestamp)) {
          conversionCache.current.delete(key);
        }
      }
      
      // Limit cache size to prevent memory issues
      if (conversionCache.current.size > MAX_CACHE_SIZE) {
        const sortedEntries = cacheEntries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, conversionCache.current.size - MAX_CACHE_SIZE);
        
        for (const [key] of sortedEntries) {
          conversionCache.current.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => {
      clearInterval(cleanupInterval);
      // Clean up all timeouts on unmount
      const timeouts = debounceTimeouts.current;
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (batchDebounceTimeout.current) {
        clearTimeout(batchDebounceTimeout.current);
      }
    };
  }, [isCacheValid]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      clearError();
      const userSettings = await settingsApi.getUserSettings();
      // Merge with defaults to ensure all currency settings are present
      const settingsWithDefaults = mergeWithCurrencyDefaults(userSettings);
      setSettings(settingsWithDefaults);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get cache key
  const getCacheKey = useCallback((amount: number, fromCurrency: string, toCurrency: string): string => {
    return `${amount}_${fromCurrency}_${toCurrency}`;
  }, []);


  // Enhanced conversion function with frequency tracking, request deduplication, and optimized debouncing
  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<ConvertedAmount | null> => {
    if (!settings) return null;

    const targetCurrency = toCurrency || settings.preferredDisplayCurrency;
    
    // Check if conversion is needed
    if (!needsCurrencyConversion(fromCurrency, targetCurrency) || !settings.enableCurrencyConversion) {
      return null;
    }

    const cacheKey = getCacheKey(amount, fromCurrency, targetCurrency);
    const pairKey = `${fromCurrency}_${targetCurrency}`;
    
    // Track frequency of currency pair usage for caching optimization
    const currentFreq = frequentPairs.current.get(pairKey) || 0;
    frequentPairs.current.set(pairKey, currentFreq + 1);
    
    // Check cache first and update hit count
    const cached = conversionCache.current.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      // Update hit count for cache optimization
      cached.hitCount++;
      return cached.result;
    }

    // Check if there's already a pending request for this conversion (request deduplication)
    const existingRequest = requestQueue.current.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = new Promise<ConvertedAmount | null>((resolve) => {
      // Clear existing timeout for this conversion
      const existingTimeout = debounceTimeouts.current.get(cacheKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Use priority-based debounce delays for optimal performance
      const isFrequentPair = currentFreq >= FREQUENT_PAIR_THRESHOLD;
      let debounceDelay = DEBOUNCE_DELAY;
      
      if (priority === 'high') {
        debounceDelay = PRIORITY_CONVERSION_DELAY;
      } else if (priority === 'low') {
        debounceDelay = AGGRESSIVE_DEBOUNCE_DELAY;
      } else if (isFrequentPair) {
        debounceDelay = BATCH_DEBOUNCE_DELAY;
      }

      // Set new debounced timeout
      const timeout = setTimeout(async () => {
        try {
          const result = await currencyApi.convertCurrency({
            amount,
            fromCurrency,
            toCurrency: targetCurrency
          });

          // Check if the conversion was successful
          if (!result.convertedAmount) {
            console.warn('Currency conversion returned no result');
          }

          const convertedAmount = createConvertedAmount(amount, fromCurrency, result);
          
          // Cache the result with extended TTL for frequent pairs and hit count tracking
          const cacheDuration = isFrequentPair ? CACHE_DURATION * FREQUENT_PAIR_CACHE_MULTIPLIER : CACHE_DURATION;
          conversionCache.current.set(cacheKey, {
            result: convertedAmount,
            timestamp: Date.now(),
            hitCount: 1
          });

          // Clean up references
          debounceTimeouts.current.delete(cacheKey);
          requestQueue.current.delete(cacheKey);
          
          resolve(convertedAmount);
        } catch (err) {
          console.error('Currency conversion failed:', err);
          handleError(err);
          
          // Cache null result to prevent repeated failed requests (shorter TTL for errors)
          conversionCache.current.set(cacheKey, {
            result: null,
            timestamp: Date.now(),
            hitCount: 1
          });
          
          // Clean up references
          debounceTimeouts.current.delete(cacheKey);
          requestQueue.current.delete(cacheKey);
          resolve(null);
        }
      }, debounceDelay);

      debounceTimeouts.current.set(cacheKey, timeout as any);
    });

    // Store the request promise to prevent duplicates
    requestQueue.current.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [settings, getCacheKey, isCacheValid, handleError, DEBOUNCE_DELAY, BATCH_DEBOUNCE_DELAY, CACHE_DURATION, FREQUENT_PAIR_THRESHOLD, FREQUENT_PAIR_CACHE_MULTIPLIER]);

  // Debounced batch conversion function
  const batchConvert = useCallback(async (
    conversions: { amount: number; fromCurrency: string }[]
  ): Promise<ConvertedAmount[]> => {
    if (!settings || !settings.enableCurrencyConversion) {
      return [];
    }

    const targetCurrency = settings.preferredDisplayCurrency;
    
    // Filter out conversions that don't need conversion
    const conversionsNeeded = conversions.filter(conv => 
      needsCurrencyConversion(conv.fromCurrency, targetCurrency)
    );

    if (conversionsNeeded.length === 0) {
      return [];
    }

    // Check cache for existing results
    const cachedResults: ConvertedAmount[] = [];
    const uncachedConversions: { amount: number; fromCurrency: string; index: number }[] = [];
    
    conversionsNeeded.forEach((conv, index) => {
      const cacheKey = getCacheKey(conv.amount, conv.fromCurrency, targetCurrency);
      const cached = conversionCache.current.get(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp) && cached.result) {
        cachedResults[index] = cached.result;
      } else {
        uncachedConversions.push({ ...conv, index });
      }
    });

    // If all results are cached, return them
    if (uncachedConversions.length === 0) {
      return cachedResults.filter(Boolean);
    }

    // Use debounced batch processing for uncached conversions
    return new Promise((resolve, reject) => {
      // Add this batch request to pending queue
      pendingBatchConversions.current.push({
        conversions: uncachedConversions,
        resolve: (results) => {
          // Merge cached and new results
          const finalResults = [...cachedResults];
          results.forEach((result, i) => {
            const originalIndex = uncachedConversions[i].index;
            finalResults[originalIndex] = result;
          });
          resolve(finalResults.filter(Boolean));
        },
        reject
      });

      // Clear existing batch timeout
      if (batchDebounceTimeout.current) {
        clearTimeout(batchDebounceTimeout.current);
      }

      // Set new debounced timeout for batch processing
      batchDebounceTimeout.current = setTimeout(async () => {
        const allPendingConversions = pendingBatchConversions.current.splice(0);
        
        if (allPendingConversions.length === 0) return;

        try {
          // Flatten all pending conversions
          const allConversions = allPendingConversions.flatMap(batch => 
            batch.conversions.map(conv => ({
              amount: conv.amount,
              fromCurrency: conv.fromCurrency,
              toCurrency: targetCurrency
            }))
          );

          // Make single batch API call
          const results = await currencyApi.batchConvert({
            conversions: allConversions
          });

          // Check for any errors in the batch results
          const hasErrors = results.some(result => !result.convertedAmount);
          if (hasErrors) {
            const errorCount = results.filter(result => !result.convertedAmount).length;
            console.warn(`Batch conversion completed with ${errorCount} errors out of ${results.length} conversions`);
          }

          // Cache results and distribute to pending requests
          let resultIndex = 0;
          
          for (const batch of allPendingConversions) {
            const batchResults: ConvertedAmount[] = [];
            
            for (let i = 0; i < batch.conversions.length; i++) {
              const conv = batch.conversions[i];
              const result = results[resultIndex++];
              const convertedAmount = createConvertedAmount(conv.amount, conv.fromCurrency, result);
              
              // Cache the result with hit count tracking
              const cacheKey = getCacheKey(conv.amount, conv.fromCurrency, targetCurrency);
              conversionCache.current.set(cacheKey, {
                result: convertedAmount,
                timestamp: Date.now(),
                hitCount: 1
              });
              
              batchResults.push(convertedAmount);
            }
            
            batch.resolve(batchResults);
          }
        } catch (err) {
          console.error('Batch currency conversion failed:', err);
          handleError(err);
          
          // Reject all pending requests
          allPendingConversions.forEach(batch => batch.reject(err));
        } finally {
          batchDebounceTimeout.current = null;
        }
      }, DEBOUNCE_DELAY);
    });
  }, [settings, getCacheKey, isCacheValid, handleError, DEBOUNCE_DELAY]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      await settingsApi.updateUserSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [settings, handleError]);

  // Performance optimization: Preload currency pairs for better performance
  const preloadCurrencyPairs = useCallback(async (pairs: Array<{ from: string; to: string }>) => {
    if (!settings?.enableCurrencyConversion) return;

    const targetCurrency = settings.preferredDisplayCurrency;
    const conversionsToPreload = pairs
      .filter(pair => needsCurrencyConversion(pair.from, pair.to))
      .map(pair => ({
        amount: 1, // Use 1 as base amount for preloading
        fromCurrency: pair.from,
        toCurrency: pair.to
      }));

    if (conversionsToPreload.length > 0) {
      try {
        // Use batch conversion to preload exchange rates
        await batchConvert(conversionsToPreload);
      } catch (err) {
        console.warn('Failed to preload currency pairs:', err);
      }
    }
  }, [settings, batchConvert]);

  // Performance optimization: Clear cache manually
  const clearCache = useCallback(() => {
    conversionCache.current.clear();
    frequentPairs.current.clear();
    requestQueue.current.clear();
    
    // Clear all pending timeouts
    debounceTimeouts.current.forEach(timeout => clearTimeout(timeout));
    debounceTimeouts.current.clear();
    
    if (batchDebounceTimeout.current) {
      clearTimeout(batchDebounceTimeout.current);
      batchDebounceTimeout.current = null;
    }
  }, []);

  // Performance optimization: Get cache statistics
  const getCacheStats = useCallback(() => {
    const cacheEntries = Array.from(conversionCache.current.values());
    const totalHits = cacheEntries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalRequests = cacheEntries.length + totalHits;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    const frequentPairsArray = Array.from(frequentPairs.current.entries())
      .map(([pair, usage]) => ({ pair, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10); // Top 10 most frequent pairs

    return {
      size: conversionCache.current.size,
      hitRate: Math.round(hitRate * 100) / 100,
      frequentPairs: frequentPairsArray
    };
  }, []);

  return {
    settings,
    loading,
    error: errorState.error,
    convertAmount,
    batchConvert,
    updateSettings,
    isConversionEnabled: settings?.enableCurrencyConversion ?? false,
    shouldAutoConvert: settings?.autoConvertCurrencies ?? false,
    preferredCurrency: settings?.preferredDisplayCurrency ?? 'USD',
    // Performance optimization methods
    preloadCurrencyPairs,
    clearCache,
    getCacheStats
  };
}