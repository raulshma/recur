import Constants from "expo-constants";
import { Platform } from "react-native";

// Define environment types
type Environment = "development" | "staging" | "production";

// Define API configuration interface
interface ApiEnvironmentConfig {
  API_URL: string;
  TIMEOUT: number;
  RETRY_ATTEMPTS: number;
  RETRY_DELAY: number;
  CACHE_TTL: number;
  USE_MOCK_DATA: boolean;
  ENABLE_LOGGING: boolean;
  AUTH_HEADER_NAME: string;
  REFRESH_TOKEN_THRESHOLD_MS: number;
}

/**
 * Get the current environment from Expo Constants
 * This function determines the environment based on the Expo release channel
 * and can be customized based on your deployment workflow
 */
const getEnvironment = (): Environment => {
  // Check for environment variables first (useful for CI/CD pipelines)
  if (process.env.EXPO_ENV) {
    const envName = process.env.EXPO_ENV.toLowerCase();
    if (
      envName === "production" ||
      envName === "staging" ||
      envName === "development"
    ) {
      return envName as Environment;
    }
  }

  // Get channel from Expo config or use a default value
  const channel = Constants.expoConfig?.extra?.channel || "development";

  // Determine environment from channel
  if (channel === "default" || channel === "development") {
    return "development";
  } else if (channel.includes("staging")) {
    return "staging";
  } else if (channel.includes("prod")) {
    return "production";
  }

  // Default to development for safety
  return "development";
};

/**
 * Get the appropriate API URL based on platform and environment
 * This handles different scenarios:
 * - Android emulator: 10.0.2.2
 * - iOS simulator: localhost
 * - Physical device: Your computer's IP address (you'll need to set this)
 */
const getApiUrl = (env: Environment): string => {
  // Get host and port from environment variables with fallbacks
  const apiHost = process.env.EXPO_PUBLIC_API_HOST || "192.168.0.187";
  const apiPort = process.env.EXPO_PUBLIC_API_PORT || "7061";

  // Enhanced device detection with better logic
  const isAndroidEmulator =
    Platform.OS === "android" &&
    (Constants.platform?.android?.isDevice === false ||
      Constants.deviceName?.includes("emulator") ||
      Constants.deviceName?.includes("simulator"));

  const isIOSSimulator =
    Platform.OS === "ios" &&
    (Constants.platform?.ios?.simulator === true ||
      Constants.deviceName?.includes("Simulator"));

  const isPhysicalDevice = !isAndroidEmulator && !isIOSSimulator;

  // Debug logging for development
  if (__DEV__) {
    console.log("=== API URL Configuration Debug ===");
    console.log("Platform:", Platform.OS);
    console.log("Device Name:", Constants.deviceName);
    console.log("Android isDevice:", Constants.platform?.android?.isDevice);
    console.log("iOS simulator:", Constants.platform?.ios?.simulator);
    console.log("Detected as Android Emulator:", isAndroidEmulator);
    console.log("Detected as iOS Simulator:", isIOSSimulator);
    console.log("Detected as Physical Device:", isPhysicalDevice);
    console.log("API Host from env:", apiHost);

    console.log("Environment:", env);
    console.log("=====================================");
  }

  // For development, determine the appropriate local URL
  if (env === "development") {
    let url: string;

    if (isAndroidEmulator) {
      // Android emulator - use special IP that maps to host machine
      url = "http://10.0.2.2:7061/api";
      if (__DEV__) console.log("✅ Using Android Emulator URL:", url);
    } else if (isPhysicalDevice) {
      // Physical device - use network IP (HTTP not HTTPS for local dev)
      url = `http://${apiHost}:${apiPort}/api`;
      if (__DEV__) console.log("✅ Using Physical Device URL:", url);
    } else {
      // iOS simulator or fallback - use localhost
      url = "http://localhost:7061/api";
      if (__DEV__) console.log("✅ Using iOS Simulator/Fallback URL:", url);
    }

    return url;
  }

  // Production/staging URLs
  switch (env) {
    case "staging":
      return "https://staging-api.recur-app.com/api";
    case "production":
      return "https://api.recur-app.com/api";
    default:
      return "http://localhost:7061/api";
  }
};

// API configuration for different environments
const ENV_CONFIG: Record<Environment, ApiEnvironmentConfig> = {
  development: {
    API_URL: getApiUrl("development"),
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    USE_MOCK_DATA: false,
    ENABLE_LOGGING: true,
    AUTH_HEADER_NAME: "Authorization",
    REFRESH_TOKEN_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes before expiry
  },
  staging: {
    API_URL: getApiUrl("staging"),
    TIMEOUT: 15000, // 15 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
    CACHE_TTL: 10 * 60 * 1000, // 10 minutes
    USE_MOCK_DATA: false,
    ENABLE_LOGGING: true,
    AUTH_HEADER_NAME: "Authorization",
    REFRESH_TOKEN_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes before expiry
  },
  production: {
    API_URL: getApiUrl("production"),
    TIMEOUT: 20000, // 20 seconds
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 3000,
    CACHE_TTL: 15 * 60 * 1000, // 15 minutes
    USE_MOCK_DATA: false,
    ENABLE_LOGGING: false, // Disable logging in production
    AUTH_HEADER_NAME: "Authorization",
    REFRESH_TOKEN_THRESHOLD_MS: 10 * 60 * 1000, // 10 minutes before expiry
  },
};

// Current environment
const CURRENT_ENV = getEnvironment();

// Export the configuration for the current environment
export const API_CONFIG = {
  ...ENV_CONFIG[CURRENT_ENV],
  ENV: CURRENT_ENV,
};

/**
 * API endpoints configuration
 * This object defines all the API endpoints used in the application
 * Using functions for parameterized endpoints ensures type safety
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH_TOKEN: "/auth/refresh",
    LOGOUT: "/auth/logout",
    CURRENT_USER: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
  },
  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    DETAIL: (id: number) => `/subscriptions/${id}`,
    HISTORY: (id: number) => `/subscriptions/${id}/history`,
    CANCEL: (id: number) => `/subscriptions/${id}/cancel`,
    REACTIVATE: (id: number) => `/subscriptions/${id}/reactivate`,
    SEARCH: "/subscriptions/search",
    UPCOMING: "/subscriptions/upcoming",
    EXPIRING_TRIALS: "/subscriptions/expiring-trials",
    STATS: "/subscriptions/stats",
  },
  CATEGORIES: {
    BASE: "/categories",
    DETAIL: (id: number) => `/categories/${id}`,
    WITH_SUBSCRIPTIONS: "/categories/with-subscriptions",
    DEFAULT: "/categories/default",
  },
  DASHBOARD: {
    STATS: "/dashboard/stats",
    MONTHLY_SPENDING: "/dashboard/monthly-spending",
    CATEGORY_SPENDING: "/dashboard/category-spending",
    UPCOMING_BILLS: "/dashboard/upcoming-bills",
    RECENT_ACTIVITY: "/dashboard/recent-activity",
    YEARLY_SUMMARY: "/dashboard/yearly-summary",
    SPENDING_TRENDS: "/dashboard/spending-trends",
  },
  NOTIFICATIONS: {
    BASE: "/notifications",
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
    SETTINGS: "/notifications/settings",
    UNREAD_COUNT: "/notifications/unread-count",
  },
  USER: {
    PROFILE: "/user/profile",
    CHANGE_PASSWORD: "/user/change-password",
    SETTINGS: "/user/settings",
    PREFERENCES: "/user/preferences",
    CURRENCY: "/user/currency",
    EXPORT_DATA: "/user/export-data",
    DELETE_ACCOUNT: "/user/delete-account",
  },
  SYSTEM: {
    HEALTH: "/system/health",
    VERSION: "/system/version",
    CONFIG: "/system/config",
  },
};
