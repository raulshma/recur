import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const useAppInitialization = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const loadSettings = useAppSettingsStore(state => state.loadSettings);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const settingsLoading = useAppSettingsStore(state => state.isLoading);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setError(null);
        
        // Initialize app settings and check authentication status
        await Promise.all([
          loadSettings(),
          checkAuthStatus(),
        ]);
        
        // TODO: Add other initialization tasks here:
        // - Register for push notifications
        // - Check for app updates
        // - Initialize analytics
        // - Load cached data
        
        setIsReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize app';
        setError(errorMessage);
        console.error('App initialization error:', err);
        
        // Even if initialization fails, we should still show the app
        // The user can retry or continue with limited functionality
        setIsReady(true);
      }
    };

    initializeApp();
  }, [checkAuthStatus, loadSettings]);

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (isReady && !authLoading && !settingsLoading) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Failed to hide splash screen:', error);
        }
      }
    };

    hideSplashScreen();
  }, [isReady, authLoading, settingsLoading]);

  return {
    isReady,
    error,
    isAuthenticated,
    isLoading: !isReady || authLoading || settingsLoading,
  };
};