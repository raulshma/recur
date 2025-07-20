import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000/api' // Development API URL
    : 'https://api.recur.app/api', // Production API URL
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Recur',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUNDLE_ID: Constants.expoConfig?.ios?.bundleIdentifier || 'com.recur.app',
  SCHEME: Constants.expoConfig?.scheme || 'recurnative',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  APP_SETTINGS: 'app_settings',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  CURRENCY_PREFERENCE: 'currency_preference',
  NOTIFICATION_SETTINGS: 'notification_settings',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  AUTH: ['auth'],
  USER: ['user'],
  SUBSCRIPTIONS: ['subscriptions'],
  CATEGORIES: ['categories'],
  DASHBOARD: ['dashboard'],
  NOTIFICATIONS: ['notifications'],
  ANALYTICS: ['analytics'],
} as const;

// Navigation Routes
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    BIOMETRIC_SETUP: '/auth/biometric-setup',
  },
  MAIN: {
    DASHBOARD: '/(tabs)/dashboard',
    SUBSCRIPTIONS: '/(tabs)/subscriptions',
    CATEGORIES: '/(tabs)/categories',
    NOTIFICATIONS: '/(tabs)/notifications',
    PROFILE: '/(tabs)/profile',
  },
  MODALS: {
    ADD_SUBSCRIPTION: '/modals/add-subscription',
    EDIT_SUBSCRIPTION: '/modals/edit-subscription',
    ADD_CATEGORY: '/modals/add-category',
    EDIT_CATEGORY: '/modals/edit-category',
  },
} as const;

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    BACKGROUND: '#F2F2F7',
    SURFACE: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#8E8E93',
    BORDER: '#C6C6C8',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
  },
  FONT_SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  SUBSCRIPTION_NAME_MAX_LENGTH: 100,
  CATEGORY_NAME_MAX_LENGTH: 50,
  NOTES_MAX_LENGTH: 500,
} as const;

// Currency Configuration
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
] as const;

// Billing Cycles
export const BILLING_CYCLES = {
  WEEKLY: { id: 1, name: 'Weekly', multiplier: 52 },
  MONTHLY: { id: 2, name: 'Monthly', multiplier: 12 },
  QUARTERLY: { id: 3, name: 'Quarterly', multiplier: 4 },
  SEMI_ANNUALLY: { id: 4, name: 'Semi-Annually', multiplier: 2 },
  ANNUALLY: { id: 5, name: 'Annually', multiplier: 1 },
  BIANNUALLY: { id: 6, name: 'Biannually', multiplier: 0.5 },
} as const;