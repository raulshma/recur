import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/config';
import { focusManager, onlineManager } from '@tanstack/react-query';

// Configure React Query for mobile with offline support
focusManager.setEventListener((handleFocus) => {
  // Mobile apps don't have window focus, so we disable this
  return () => {};
});

// Create a client with optimized settings for mobile
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: (failureCount, error: any) => {
        // Don't retry if we're offline
        if (!onlineManager.isOnline()) {
          return false;
        }
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus (mobile doesn't have window focus)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
      // Network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once
      retry: (failureCount, error: any) => {
        // Don't retry if we're offline
        if (!onlineManager.isOnline()) {
          return false;
        }
        // Don't retry on 4xx errors
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 1;
      },
      // Retry delay for mutations
      retryDelay: 1000,
      // Network mode for offline support
      networkMode: 'offlineFirst',
    },
  },
});

// Query key factories for consistent key management
export const queryKeys = {
  // Authentication queries
  auth: {
    all: () => [...QUERY_KEYS.AUTH] as const,
    user: () => [...QUERY_KEYS.AUTH, 'user'] as const,
    status: () => [...QUERY_KEYS.AUTH, 'status'] as const,
  },
  
  // User queries
  user: {
    all: () => [...QUERY_KEYS.USER] as const,
    profile: () => [...QUERY_KEYS.USER, 'profile'] as const,
    settings: () => [...QUERY_KEYS.USER, 'settings'] as const,
  },
  
  // Subscription queries
  subscriptions: {
    all: () => [...QUERY_KEYS.SUBSCRIPTIONS] as const,
    lists: () => [...QUERY_KEYS.SUBSCRIPTIONS, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.SUBSCRIPTIONS, 'list', filters] as const,
    details: () => [...QUERY_KEYS.SUBSCRIPTIONS, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.SUBSCRIPTIONS, 'detail', id] as const,
    history: (id: number) => [...QUERY_KEYS.SUBSCRIPTIONS, 'history', id] as const,
  },
  
  // Category queries
  categories: {
    all: () => [...QUERY_KEYS.CATEGORIES] as const,
    lists: () => [...QUERY_KEYS.CATEGORIES, 'list'] as const,
    list: () => [...QUERY_KEYS.CATEGORIES, 'list'] as const,
    details: () => [...QUERY_KEYS.CATEGORIES, 'detail'] as const,
    detail: (id: number) => [...QUERY_KEYS.CATEGORIES, 'detail', id] as const,
  },
  
  // Dashboard queries
  dashboard: {
    all: () => [...QUERY_KEYS.DASHBOARD] as const,
    stats: (currency?: string) => [...QUERY_KEYS.DASHBOARD, 'stats', currency] as const,
    spending: (currency?: string) => [...QUERY_KEYS.DASHBOARD, 'spending', currency] as const,
    upcoming: (currency?: string) => [...QUERY_KEYS.DASHBOARD, 'upcoming', currency] as const,
    activity: () => [...QUERY_KEYS.DASHBOARD, 'activity'] as const,
  },
  
  // Notification queries
  notifications: {
    all: () => [...QUERY_KEYS.NOTIFICATIONS] as const,
    lists: () => [...QUERY_KEYS.NOTIFICATIONS, 'list'] as const,
    list: () => [...QUERY_KEYS.NOTIFICATIONS, 'list'] as const,
    unread: () => [...QUERY_KEYS.NOTIFICATIONS, 'unread'] as const,
    count: () => [...QUERY_KEYS.NOTIFICATIONS, 'count'] as const,
  },
  
  // Analytics queries
  analytics: {
    all: () => [...QUERY_KEYS.ANALYTICS] as const,
    overview: (timeRange: string, currency?: string) => 
      [...QUERY_KEYS.ANALYTICS, 'overview', timeRange, currency] as const,
    monthly: (currency?: string) => 
      [...QUERY_KEYS.ANALYTICS, 'monthly', currency] as const,
    categories: (currency?: string) => 
      [...QUERY_KEYS.ANALYTICS, 'categories', currency] as const,
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all subscription-related queries
  subscriptions: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
  },
  
  // Invalidate all category-related queries
  categories: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
  },
  
  // Invalidate all dashboard queries
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
  },
  
  // Invalidate all notification queries
  notifications: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
  },
  
  // Invalidate user-related queries
  user: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
  },
  
  // Invalidate everything (use sparingly)
  all: () => {
    queryClient.invalidateQueries();
  },
};

// Helper function to remove queries from cache
export const removeQueries = {
  subscriptions: () => {
    queryClient.removeQueries({ queryKey: queryKeys.subscriptions.all() });
  },
  
  categories: () => {
    queryClient.removeQueries({ queryKey: queryKeys.categories.all() });
  },
  
  dashboard: () => {
    queryClient.removeQueries({ queryKey: queryKeys.dashboard.all() });
  },
  
  notifications: () => {
    queryClient.removeQueries({ queryKey: queryKeys.notifications.all() });
  },
  
  user: () => {
    queryClient.removeQueries({ queryKey: queryKeys.user.all() });
    queryClient.removeQueries({ queryKey: queryKeys.auth.all() });
  },
  
  all: () => {
    queryClient.clear();
  },
};

// Configure online manager for React Query
export const configureOnlineManager = () => {
  onlineManager.setEventListener((setOnline) => {
    // Set up network state listener
    const handleNetworkChange = (isOnline: boolean) => {
      setOnline(isOnline);
    };
    
    // Return cleanup function
    return () => {
      // Cleanup if needed
    };
  });
};

// Helper to manually set online status
export const setOnlineStatus = (isOnline: boolean) => {
  onlineManager.setOnline(isOnline);
};