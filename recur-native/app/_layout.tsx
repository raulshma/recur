import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { QueryProvider } from '@/providers/QueryProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/providers/AuthProvider';
import * as Sentry from '@sentry/react-native';
import linking from './linking';

Sentry.init({
  dsn: 'https://8479d64f0cb7f63b20e31edbe8b7446d@o4508335945547776.ingest.de.sentry.io/4509701460852816',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function AppContent() {
  const colorScheme = useColorScheme();
  const { isLoading, error } = useAppInitialization();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Show loading screen while fonts are loading or app is initializing
  if (!loaded || isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        message={!loaded ? "Loading fonts..." : "Initializing app..."} 
      />
    );
  }

  // Show error if app initialization failed
  if (error) {
    console.error('App initialization error:', error);
    // Still continue to show the app - user can retry or use limited functionality
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
          // @ts-ignore - linking is supported but TypeScript doesn't recognize it
          linking={linking}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen 
            name="modals" 
            options={{ 
              headerShown: false, 
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }} 
          />
          <Stack.Screen name="subscriptions/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
});