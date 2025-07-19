import type { UserSettings } from '../api/settings';

/**
 * Default currency conversion settings
 */
export const DEFAULT_CURRENCY_SETTINGS: Partial<UserSettings> = {
  enableCurrencyConversion: false,
  autoConvertCurrencies: true,
  preferredDisplayCurrency: 'USD',
  showOriginalCurrency: true,
  showConversionRates: false,
  currencyRefreshInterval: 60, // 1 hour
};

/**
 * Merge user settings with default currency settings
 */
export function mergeWithCurrencyDefaults(userSettings: Partial<UserSettings>): UserSettings {
  return {
    // Default notification settings
    discordNotifications: false,
    discordWebhookUrl: '',
    trialEndingAlerts: true,
    billingReminders: true,
    priceChangeAlerts: true,
    recommendationAlerts: true,
    trialEndingReminderDays: 3,
    billingReminderDays: 2,
    defaultCurrency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeZone: 'UTC',
    theme: 'light',
    
    // Merge with defaults and user settings
    ...DEFAULT_CURRENCY_SETTINGS,
    ...userSettings,
  } as UserSettings;
}

/**
 * Validate currency conversion settings
 */
export function validateCurrencySettings(settings: Partial<UserSettings>): string[] {
  const errors: string[] = [];

  if (settings.enableCurrencyConversion) {
    if (!settings.preferredDisplayCurrency) {
      errors.push('Preferred display currency is required when conversion is enabled');
    }

    if (settings.currencyRefreshInterval && settings.currencyRefreshInterval < 15) {
      errors.push('Currency refresh interval must be at least 15 minutes');
    }

    if (settings.currencyRefreshInterval && settings.currencyRefreshInterval > 1440) {
      errors.push('Currency refresh interval cannot exceed 24 hours');
    }
  }

  return errors;
}