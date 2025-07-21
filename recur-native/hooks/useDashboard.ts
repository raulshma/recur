import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dashboardService } from '@/services/api';
import { queryKeys, invalidateQueries } from '@/services/queryClient';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { convertCurrency, batchConvertCurrency } from '@/utils/currencyUtils';
import { cacheStorage } from '@/services/storage';
import { DashboardStats, MonthlySpending, CategorySpending, UpcomingBill, RecentActivity } from '@/types';
import { useCallback } from 'react';
import { onlineManager } from '@tanstack/react-query';

// Hook for fetching dashboard stats with currency conversion
export const useDashboardStats = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();

  const query = useQuery({
    queryKey: queryKeys.dashboard.stats(targetCurrency),
    queryFn: async () => {
      // Try to get from cache first for immediate UI display
      const cachedStats = await cacheStorage.getCacheData<DashboardStats>(`dashboard_stats_${targetCurrency}`);
      
      if (cachedStats) {
        // Update state with cached data while fetching fresh data
        dashboardStore.stats = cachedStats;
      }
      
      // Fetch fresh data from API
      const stats = await dashboardService.getDashboardStats(targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`dashboard_stats_${targetCurrency}`, stats, 5); // 5 minutes
      
      // Update dashboard store
      dashboardStore.stats = stats;
      
      return stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Use cached data if available while fetching
    placeholderData: () => dashboardStore.stats || undefined,
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry if we're offline
      if (!onlineManager.isOnline()) {
        return false;
      }
      // Don't retry on 4xx errors
      if (error?.statusCode >= 400 && error?.statusCode < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Function to manually refresh dashboard stats
  const refreshStats = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(targetCurrency) });
      return true;
    } catch (error) {
      console.error('Failed to refresh dashboard stats:', error);
      return false;
    }
  }, [queryClient, targetCurrency]);

  return {
    ...query,
    refreshStats,
  };
};

// Hook for fetching notifications with background refresh
export const useNotifications = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      // Try to get from cache first
      const cachedNotifications = await cacheStorage.getCacheData<any[]>('notifications');
      
      // Fetch fresh data from API
      const notifications = await dashboardService.getNotifications();
      
      // Cache the results
      await cacheStorage.setCacheData('notifications', notifications, 2); // 2 minutes
      
      return notifications;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      // This would typically call an API endpoint
      // For now, we'll just update the cache
      const currentNotifications = queryClient.getQueryData<any[]>(queryKeys.notifications.list()) || [];
      const updatedNotifications = currentNotifications.map(notification => 
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      );
      
      // Update the cache
      queryClient.setQueryData(queryKeys.notifications.list(), updatedNotifications);
      await cacheStorage.setCacheData('notifications', updatedNotifications, 2);
      
      return { success: true };
    },
    onSuccess: () => {
      // Update notification count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count() });
    }
  });

  // Function to manually refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      return true;
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      return false;
    }
  }, [queryClient]);

  return {
    ...query,
    markAsRead,
    refreshNotifications,
  };
};

// Hook for fetching monthly spending with currency conversion
export const useMonthlySpending = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();

  const query = useQuery({
    queryKey: queryKeys.analytics.monthly(targetCurrency),
    queryFn: async () => {
      // Try to get from cache first
      const cachedSpending = await cacheStorage.getCacheData<MonthlySpending[]>(`monthly_spending_${targetCurrency}`);
      
      if (cachedSpending) {
        // Update state with cached data while fetching fresh data
        dashboardStore.monthlySpending = cachedSpending;
      }
      
      // Fetch fresh data from API
      const spending = await dashboardService.getMonthlySpending(targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`monthly_spending_${targetCurrency}`, spending, 10); // 10 minutes
      
      // Update dashboard store
      dashboardStore.monthlySpending = spending;
      
      return spending;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    // Use cached data if available while fetching
    placeholderData: () => dashboardStore.monthlySpending || undefined,
  });

  // Function to manually refresh monthly spending
  const refreshMonthlySpending = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.analytics.monthly(targetCurrency) });
      return true;
    } catch (error) {
      console.error('Failed to refresh monthly spending:', error);
      return false;
    }
  }, [queryClient, targetCurrency]);

  return {
    ...query,
    refreshMonthlySpending,
  };
};

// Hook for fetching category spending with currency conversion
export const useCategorySpending = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();

  const query = useQuery({
    queryKey: queryKeys.analytics.categories(targetCurrency),
    queryFn: async () => {
      // Try to get from cache first
      const cachedSpending = await cacheStorage.getCacheData<CategorySpending[]>(`category_spending_${targetCurrency}`);
      
      if (cachedSpending) {
        // Update state with cached data while fetching fresh data
        dashboardStore.categorySpending = cachedSpending;
      }
      
      // Fetch fresh data from API
      const spending = await dashboardService.getCategorySpending(targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`category_spending_${targetCurrency}`, spending, 10); // 10 minutes
      
      // Update dashboard store
      dashboardStore.categorySpending = spending;
      
      return spending;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    // Use cached data if available while fetching
    placeholderData: () => dashboardStore.categorySpending || undefined,
  });

  // Function to manually refresh category spending
  const refreshCategorySpending = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.analytics.categories(targetCurrency) });
      return true;
    } catch (error) {
      console.error('Failed to refresh category spending:', error);
      return false;
    }
  }, [queryClient, targetCurrency]);

  return {
    ...query,
    refreshCategorySpending,
  };
};

// Hook for fetching upcoming bills with currency conversion
export const useUpcomingBills = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();

  const query = useQuery({
    queryKey: queryKeys.dashboard.upcoming(targetCurrency),
    queryFn: async () => {
      // Try to get from cache first
      const cachedBills = await cacheStorage.getCacheData<UpcomingBill[]>(`upcoming_bills_${targetCurrency}`);
      
      if (cachedBills) {
        // Update state with cached data while fetching fresh data
        dashboardStore.upcomingBills = cachedBills;
      }
      
      // Fetch fresh data from API
      const bills = await dashboardService.getUpcomingBills(targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`upcoming_bills_${targetCurrency}`, bills, 5); // 5 minutes
      
      // Update dashboard store
      dashboardStore.upcomingBills = bills;
      
      return bills;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Use cached data if available while fetching
    placeholderData: () => dashboardStore.upcomingBills || undefined,
  });

  // Function to manually refresh upcoming bills
  const refreshUpcomingBills = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.upcoming(targetCurrency) });
      return true;
    } catch (error) {
      console.error('Failed to refresh upcoming bills:', error);
      return false;
    }
  }, [queryClient, targetCurrency]);

  return {
    ...query,
    refreshUpcomingBills,
  };
};

// Hook for fetching recent activity with currency conversion
export const useRecentActivity = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();

  const query = useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: async () => {
      // Try to get from cache first
      const cachedActivity = await cacheStorage.getCacheData<RecentActivity[]>(`recent_activity_${targetCurrency}`);
      
      if (cachedActivity) {
        // Update state with cached data while fetching fresh data
        dashboardStore.recentActivity = cachedActivity;
      }
      
      // Fetch fresh data from API
      const activity = await dashboardService.getRecentActivity(targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`recent_activity_${targetCurrency}`, activity, 5); // 5 minutes
      
      // Update dashboard store
      dashboardStore.recentActivity = activity;
      
      return activity;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Use cached data if available while fetching
    placeholderData: () => dashboardStore.recentActivity || undefined,
  });

  // Function to manually refresh recent activity
  const refreshRecentActivity = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.activity() });
      return true;
    } catch (error) {
      console.error('Failed to refresh recent activity:', error);
      return false;
    }
  }, [queryClient]);

  return {
    ...query,
    refreshRecentActivity,
  };
};

// Hook for fetching analytics overview with currency conversion
export const useAnalyticsOverview = (timeRange: string, currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;

  const query = useQuery({
    queryKey: queryKeys.analytics.overview(timeRange, targetCurrency),
    queryFn: async () => {
      // Try to get from cache first
      const cachedOverview = await cacheStorage.getCacheData(`analytics_overview_${timeRange}_${targetCurrency}`);
      
      // Fetch fresh data from API
      const overview = await dashboardService.getAnalyticsOverview(timeRange, targetCurrency);
      
      // Cache the results
      await cacheStorage.setCacheData(`analytics_overview_${timeRange}_${targetCurrency}`, overview, 10); // 10 minutes
      
      return overview;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!timeRange,
  });

  // Function to manually refresh analytics overview
  const refreshAnalyticsOverview = useCallback(async () => {
    if (!timeRange) return false;
    
    try {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.overview(timeRange, targetCurrency) 
      });
      return true;
    } catch (error) {
      console.error('Failed to refresh analytics overview:', error);
      return false;
    }
  }, [queryClient, timeRange, targetCurrency]);

  return {
    ...query,
    refreshAnalyticsOverview,
  };
};

// Hook for refreshing all dashboard data at once
export const useRefreshDashboard = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const queryClient = useQueryClient();
  const targetCurrency = currency || defaultCurrency;
  const dashboardStore = useDashboardStore();
  
  const refreshAll = useCallback(async () => {
    try {
      dashboardStore.isRefreshing = true;
      
      // Invalidate all dashboard-related queries
      await invalidateQueries.dashboard();
      
      // Update last refreshed timestamp
      dashboardStore.lastUpdated = new Date();
      
      return true;
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      return false;
    } finally {
      dashboardStore.isRefreshing = false;
    }
  }, [queryClient, targetCurrency, dashboardStore]);
  
  return { refreshAll, isRefreshing: dashboardStore.isRefreshing };
};