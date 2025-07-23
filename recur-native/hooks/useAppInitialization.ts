import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { authStorage } from '@/services/storage';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, AppStateStatus } from 'react-native';
import { debugApiConfig } from '@/utils/debugApiConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const useAppInitialization = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const loadSettings = useAppSettingsStore(state => state.loadSettings);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const settingsLoading = useAppSettingsStore(state => state.isLoading);

  // Handle app state changes for token refresh
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes to foreground
      if (nextAppState === 'active') {
        try {
          // Check if user is authenticated
          const isAuth = await authStorage.isAuthenticated();
          if (isAuth) {
            // Check if token is expired or about to expire
            const isExpired = await authStorage.isTokenExpired();
            if (isExpired) {
              // Refresh token silently
              await refreshToken();
            }
          }
        } catch (error) {
          console.error('Error handling app state change:', error);
        }
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refreshToken]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setError(null);
        
        // Debug API configuration in development
        if (__DEV__) {
          debugApiConfig();
        }
        
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