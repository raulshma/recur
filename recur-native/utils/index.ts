// Utility functions for the Recur mobile app

import { VALIDATION, CURRENCIES, BILLING_CYCLES } from '@/constants/config';
import { BillingCycle } from '@/types';

// Date utilities
export const dateUtils = {
  // Format date for display
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  },

  // Format date with time
  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  },

  // Get relative time (e.g., "3 days ago", "in 5 days")
  getRelativeTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = dateObj.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays === -1) return 'Yesterday';
    if (diffInDays > 0) return `In ${diffInDays} days`;
    return `${Math.abs(diffInDays)} days ago`;
  },

  // Check if date is today
  isToday: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  },

  // Check if date is within next N days
  isWithinDays: (date: Date | string, days: number): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = dateObj.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays >= 0 && diffInDays <= days;
  },

  // Add days to date
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Get start of day
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Get end of day
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
};

// Currency utilities
export const currencyUtils = {
  // Format currency amount
  formatCurrency: (amount: number, currency: string = 'USD'): string => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Get currency symbol
  getCurrencySymbol: (currency: string): string => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    return currencyInfo?.symbol || currency;
  },

  // Convert billing cycle cost to monthly equivalent
  convertToMonthly: (cost: number, billingCycle: BillingCycle): number => {
    const cycleInfo = Object.values(BILLING_CYCLES).find(c => c.id === billingCycle);
    if (!cycleInfo) return cost;
    return cost * cycleInfo.multiplier / 12;
  },

  // Convert billing cycle cost to annual equivalent
  convertToAnnual: (cost: number, billingCycle: BillingCycle): number => {
    const cycleInfo = Object.values(BILLING_CYCLES).find(c => c.id === billingCycle);
    if (!cycleInfo) return cost * 12;
    return cost * cycleInfo.multiplier;
  },

  // Calculate savings between billing cycles
  calculateSavings: (monthlyCost: number, annualCost: number): number => {
    const annualEquivalentOfMonthly = monthlyCost * 12;
    return annualEquivalentOfMonthly - annualCost;
  },
};

// Validation utilities
export const validationUtils = {
  // Validate email
  isValidEmail: (email: string): boolean => {
    return VALIDATION.EMAIL_REGEX.test(email.trim());
  },

  // Validate password
  isValidPassword: (password: string): boolean => {
    return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
  },

  // Validate subscription name
  isValidSubscriptionName: (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= VALIDATION.SUBSCRIPTION_NAME_MAX_LENGTH;
  },

  // Validate category name
  isValidCategoryName: (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= VALIDATION.CATEGORY_NAME_MAX_LENGTH;
  },

  // Validate cost amount
  isValidCost: (cost: number): boolean => {
    return cost > 0 && cost < 999999.99 && Number.isFinite(cost);
  },

  // Validate notes
  isValidNotes: (notes: string): boolean => {
    return notes.length <= VALIDATION.NOTES_MAX_LENGTH;
  },

  // Get validation error message
  getValidationError: (field: string, value: any): string | null => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!validationUtils.isValidEmail(value)) return 'Please enter a valid email address';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (!validationUtils.isValidPassword(value)) return `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
        break;
      case 'subscriptionName':
        if (!value?.trim()) return 'Subscription name is required';
        if (!validationUtils.isValidSubscriptionName(value)) return `Name must be 1-${VALIDATION.SUBSCRIPTION_NAME_MAX_LENGTH} characters`;
        break;
      case 'categoryName':
        if (!value?.trim()) return 'Category name is required';
        if (!validationUtils.isValidCategoryName(value)) return `Name must be 1-${VALIDATION.CATEGORY_NAME_MAX_LENGTH} characters`;
        break;
      case 'cost':
        if (!value && value !== 0) return 'Cost is required';
        if (!validationUtils.isValidCost(value)) return 'Please enter a valid cost amount';
        break;
      case 'notes':
        if (value && !validationUtils.isValidNotes(value)) return `Notes must be less than ${VALIDATION.NOTES_MAX_LENGTH} characters`;
        break;
      default:
        return null;
    }
    return null;
  },
};

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Truncate string with ellipsis
  truncate: (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  },

  // Generate initials from name
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Remove extra whitespace
  cleanWhitespace: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },

  // Generate random string
  generateRandomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Array utilities
export const arrayUtils = {
  // Group array by key
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  // Sort array by multiple keys
  sortBy: <T>(array: T[], ...keys: (keyof T)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },

  // Remove duplicates from array
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  // Remove duplicates by key
  uniqueBy: <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

// Color utilities
export const colorUtils = {
  // Generate random color
  generateRandomColor: (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    ];
    return colors[Math.floor(Math.random() * colors.length)] || '#95A5A6';
  },

  // Check if color is light or dark
  isLightColor: (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  },

  // Get contrasting text color
  getContrastingTextColor: (backgroundColor: string): string => {
    return colorUtils.isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
  },
};

// Device utilities
export const deviceUtils = {
  // Check if running on iOS
  isIOS: (): boolean => {
    return require('react-native').Platform.OS === 'ios';
  },

  // Check if running on Android
  isAndroid: (): boolean => {
    return require('react-native').Platform.OS === 'android';
  },

  // Get platform-specific value
  platformSelect: <T>(values: { ios: T; android: T }): T => {
    return require('react-native').Platform.select(values);
  },
};

// Export all utilities as default export to avoid redeclaration
export default {
  dateUtils,
  currencyUtils,
  validationUtils,
  stringUtils,
  arrayUtils,
  colorUtils,
  deviceUtils,
};