import { useState, useEffect, useCallback } from 'react';
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
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<ConvertedAmount | null>;
  batchConvert: (conversions: { amount: number; fromCurrency: string }[]) => Promise<ConvertedAmount[]>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isConversionEnabled: boolean;
  shouldAutoConvert: boolean;
  preferredCurrency: string;
}

export function useCurrencyConversion(): UseCurrencyConversionReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { errorState, handleError, clearError } = useCurrencyErrorHandler();

  // Load user settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

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

  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<ConvertedAmount | null> => {
    if (!settings) return null;

    const targetCurrency = toCurrency || settings.preferredDisplayCurrency;
    
    // Check if conversion is needed
    if (!needsCurrencyConversion(fromCurrency, targetCurrency) || !settings.enableCurrencyConversion) {
      return null;
    }

    try {
      const result = await currencyApi.convertCurrency({
        amount,
        fromCurrency,
        toCurrency: targetCurrency
      });

      // Check if the conversion was successful
      if (!result.convertedAmount) {
        console.warn('Currency conversion returned no result');
        // Still return the result as it may contain fallback data
      }

      return createConvertedAmount(amount, fromCurrency, result);
    } catch (err) {
      console.error('Currency conversion failed:', err);
      handleError(err);
      return null;
    }
  }, [settings]);

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

    try {
      const results = await currencyApi.batchConvert({
        conversions: conversionsNeeded.map(conv => ({
          ...conv,
          toCurrency: targetCurrency
        }))
      });

      // Check for any errors in the batch results
      const hasErrors = results.some(result => !result.convertedAmount);
      if (hasErrors) {
        const errorCount = results.filter(result => !result.convertedAmount).length;
        console.warn(`Batch conversion completed with ${errorCount} errors out of ${results.length} conversions`);
      }

      return results.map((result, index) => 
        createConvertedAmount(
          conversionsNeeded[index].amount, 
          conversionsNeeded[index].fromCurrency, 
          result
        )
      );
    } catch (err) {
      console.error('Batch currency conversion failed:', err);
      handleError(err);
      return [];
    }
  }, [settings]);

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

  return {
    settings,
    loading,
    error: errorState.error,
    convertAmount,
    batchConvert,
    updateSettings,
    isConversionEnabled: settings?.enableCurrencyConversion ?? false,
    shouldAutoConvert: settings?.autoConvertCurrencies ?? false,
    preferredCurrency: settings?.preferredDisplayCurrency ?? 'USD'
  };
}