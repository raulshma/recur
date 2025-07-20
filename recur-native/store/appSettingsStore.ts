import { create } from 'zustand';
import { AppSettings, NotificationSettings } from '@/types';
import { settingsStorage } from '@/services/storage';

interface AppSettingsState extends AppSettings {
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrency: (currency: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setTimeZone: (timeZone: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  clearError: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  currency: 'USD',
  theme: 'system',
  notifications: {
    billReminders: true,
    trialEndings: true,
    budgetAlerts: true,
    pushNotifications: true,
    emailNotifications: true,
    reminderDays: 7,
  },
  biometricEnabled: false,
  language: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  // Initial state with defaults
  ...defaultSettings,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrency: async (currency) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update local state
      set({ currency });
      
      // Persist to storage
      await settingsStorage.updateSetting('currency', currency);
      
      // TODO: Notify other parts of the app about currency change
      // This might involve invalidating cached data with currency conversions
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update currency';
      setError(errorMessage);
      console.error('Failed to set currency:', error);
    } finally {
      setLoading(false);
    }
  },

  setTheme: async (theme) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update local state
      set({ theme });
      
      // Persist to storage
      await settingsStorage.updateSetting('theme', theme);
      
      // TODO: Apply theme changes to the app
      // This might involve updating the navigation theme or global styles
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update theme';
      setError(errorMessage);
      console.error('Failed to set theme:', error);
    } finally {
      setLoading(false);
    }
  },

  updateNotificationSettings: async (notifications) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update local state
      set({ notifications });
      
      // Persist to storage
      await settingsStorage.updateSetting('notifications', notifications);
      
      // TODO: Update push notification permissions and settings
      // This might involve registering/unregistering for push notifications
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      setError(errorMessage);
      console.error('Failed to update notification settings:', error);
    } finally {
      setLoading(false);
    }
  },

  toggleBiometric: async (biometricEnabled) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Check biometric availability before enabling
      // const isAvailable = await LocalAuthentication.hasHardwareAsync();
      // if (biometricEnabled && !isAvailable) {
      //   throw new Error('Biometric authentication is not available on this device');
      // }
      
      // Update local state
      set({ biometricEnabled });
      
      // Persist to storage
      await settingsStorage.updateSetting('biometricEnabled', biometricEnabled);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update biometric setting';
      setError(errorMessage);
      console.error('Failed to toggle biometric:', error);
    } finally {
      setLoading(false);
    }
  },

  setLanguage: async (language) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update local state
      set({ language });
      
      // Persist to storage
      await settingsStorage.updateSetting('language', language);
      
      // TODO: Update app language/localization
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update language';
      setError(errorMessage);
      console.error('Failed to set language:', error);
    } finally {
      setLoading(false);
    }
  },

  setTimeZone: async (timeZone) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update local state
      set({ timeZone });
      
      // Persist to storage
      await settingsStorage.updateSetting('timeZone', timeZone);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update timezone';
      setError(errorMessage);
      console.error('Failed to set timezone:', error);
    } finally {
      setLoading(false);
    }
  },

  loadSettings: async () => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Load settings from storage
      const storedSettings = await settingsStorage.getSettings();
      
      if (storedSettings) {
        // Merge with defaults to ensure all properties exist
        const mergedSettings = { ...defaultSettings, ...storedSettings };
        set(mergedSettings);
      } else {
        // First time - store default settings
        await settingsStorage.storeSettings(defaultSettings);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Failed to load settings:', error);
      
      // Fall back to defaults on error
      set(defaultSettings);
    } finally {
      setLoading(false);
    }
  },

  resetSettings: async () => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      // Reset to defaults
      set(defaultSettings);
      
      // Clear stored settings
      await settingsStorage.clearSettings();
      
      // Store defaults
      await settingsStorage.storeSettings(defaultSettings);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
      setError(errorMessage);
      console.error('Failed to reset settings:', error);
    } finally {
      setLoading(false);
    }
  },
}));