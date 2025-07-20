import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import { StoredAuthData, AppSettings, User } from '@/types';

// Secure Storage Service (for sensitive data like tokens)
export const secureStorage = {
  // Store sensitive data securely
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw new Error(`Failed to store secure data: ${key}`);
    }
  },

  // Retrieve sensitive data
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  },

  // Remove sensitive data
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
    }
  },

  // Check if secure item exists
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value !== null;
    } catch (error) {
      console.error(`Failed to check secure item ${key}:`, error);
      return false;
    }
  },
};

// Regular Storage Service (for non-sensitive data)
export const storage = {
  // Store regular data
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
      throw new Error(`Failed to store data: ${key}`);
    }
  },

  // Retrieve regular data
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to retrieve item ${key}:`, error);
      return null;
    }
  },

  // Remove regular data
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  },

  // Store object data
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to store object ${key}:`, error);
      throw new Error(`Failed to store object data: ${key}`);
    }
  },

  // Retrieve object data
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to retrieve object ${key}:`, error);
      return null;
    }
  },

  // Get all keys
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  },

  // Clear all data
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },

  // Get multiple items
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      return [...result];
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      return [];
    }
  },

  // Set multiple items
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw new Error('Failed to store multiple items');
    }
  },
};

// Authentication Storage Service
export const authStorage = {
  // Store authentication data
  async storeAuthData(authData: StoredAuthData): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      await storage.setObject(STORAGE_KEYS.USER_DATA, authData.user);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Retrieve authentication data
  async getAuthData(): Promise<StoredAuthData | null> {
    try {
      const [token, refreshToken, userData] = await Promise.all([
        secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.getObject<User>(STORAGE_KEYS.USER_DATA),
      ]);

      if (!token || !refreshToken || !userData) {
        return null;
      }

      return {
        token,
        refreshToken,
        user: userData,
        expiresAt: new Date().toISOString(), // This should be properly managed
      };
    } catch (error) {
      console.error('Failed to retrieve auth data:', error);
      return null;
    }
  },

  // Clear authentication data
  async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token !== null;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  },

  // Update user data
  async updateUserData(user: User): Promise<void> {
    try {
      await storage.setObject(STORAGE_KEYS.USER_DATA, user);
    } catch (error) {
      console.error('Failed to update user data:', error);
      throw new Error('Failed to update user data');
    }
  },
};

// App Settings Storage Service
export const settingsStorage = {
  // Store app settings
  async storeSettings(settings: AppSettings): Promise<void> {
    try {
      await storage.setObject(STORAGE_KEYS.APP_SETTINGS, settings);
    } catch (error) {
      console.error('Failed to store app settings:', error);
      throw new Error('Failed to store app settings');
    }
  },

  // Retrieve app settings
  async getSettings(): Promise<AppSettings | null> {
    try {
      return await storage.getObject<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
    } catch (error) {
      console.error('Failed to retrieve app settings:', error);
      return null;
    }
  },

  // Update specific setting
  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        [key]: value,
      } as AppSettings;
      
      await this.storeSettings(updatedSettings);
    } catch (error) {
      console.error(`Failed to update setting ${String(key)}:`, error);
      throw new Error(`Failed to update setting: ${String(key)}`);
    }
  },

  // Clear app settings
  async clearSettings(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEYS.APP_SETTINGS);
    } catch (error) {
      console.error('Failed to clear app settings:', error);
    }
  },
};

// Offline Queue Storage Service
export const offlineStorage = {
  // Store offline actions
  async storeOfflineAction(action: any): Promise<void> {
    try {
      const existingActions = await this.getOfflineActions();
      const updatedActions = [...existingActions, { ...action, timestamp: Date.now() }];
      await storage.setObject(STORAGE_KEYS.OFFLINE_QUEUE, updatedActions);
    } catch (error) {
      console.error('Failed to store offline action:', error);
      throw new Error('Failed to store offline action');
    }
  },

  // Retrieve offline actions
  async getOfflineActions(): Promise<any[]> {
    try {
      const actions = await storage.getObject<any[]>(STORAGE_KEYS.OFFLINE_QUEUE);
      return actions || [];
    } catch (error) {
      console.error('Failed to retrieve offline actions:', error);
      return [];
    }
  },

  // Clear offline actions
  async clearOfflineActions(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Failed to clear offline actions:', error);
    }
  },

  // Remove specific offline action
  async removeOfflineAction(actionId: string): Promise<void> {
    try {
      const existingActions = await this.getOfflineActions();
      const filteredActions = existingActions.filter(action => action.id !== actionId);
      await storage.setObject(STORAGE_KEYS.OFFLINE_QUEUE, filteredActions);
    } catch (error) {
      console.error('Failed to remove offline action:', error);
    }
  },
};

// Cache Storage Service
export const cacheStorage = {
  // Store cache data with expiration
  async setCacheData<T>(key: string, data: T, expirationMinutes = 60): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expirationTime: Date.now() + (expirationMinutes * 60 * 1000),
      };
      await storage.setObject(`cache_${key}`, cacheItem);
    } catch (error) {
      console.error(`Failed to cache data ${key}:`, error);
    }
  },

  // Retrieve cache data if not expired
  async getCacheData<T>(key: string): Promise<T | null> {
    try {
      const cacheItem = await storage.getObject<{
        data: T;
        timestamp: number;
        expirationTime: number;
      }>(`cache_${key}`);

      if (!cacheItem) {
        return null;
      }

      // Check if cache is expired
      if (Date.now() > cacheItem.expirationTime) {
        await storage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error(`Failed to retrieve cache data ${key}:`, error);
      return null;
    }
  },

  // Clear specific cache
  async clearCache(key: string): Promise<void> {
    try {
      await storage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error(`Failed to clear cache ${key}:`, error);
    }
  },

  // Clear all cache data
  async clearAllCache(): Promise<void> {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      
      await Promise.all(
        cacheKeys.map(key => storage.removeItem(key))
      );
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  },
};