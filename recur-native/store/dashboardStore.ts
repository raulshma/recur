import { create } from 'zustand';
import { DashboardStats, MonthlySpending, CategorySpending, UpcomingBill, RecentActivity } from '@/types';
import { dashboardService } from '@/services/api';
import { cacheStorage } from '@/services/storage';
import { queryClient, queryKeys, invalidateQueries } from '@/services/queryClient';
import { onlineManager } from '@tanstack/react-query';
import { convertCurrency, batchConvertCurrency } from '@/utils/currencyUtils';
import { AppState, AppStateStatus } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Background fetch task name
const BACKGROUND_FETCH_TASK = 'background-dashboard-refresh';

interface DashboardState {
  // Dashboard data
  stats: DashboardStats | null;
  monthlySpending: MonthlySpending[] | null;
  categorySpending: CategorySpending[] | null;
  upcomingBills: UpcomingBill[] | null;
  recentActivity: RecentActivity[] | null;
  
  // Currency conversion
  displayCurrency: string;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Data freshness
  dataFreshness: {
    stats: 'fresh' | 'stale' | 'offline' | 'error';
    monthlySpending: 'fresh' | 'stale' | 'offline' | 'error';
    categorySpending: 'fresh' | 'stale' | 'offline' | 'error';
    upcomingBills: 'fresh' | 'stale' | 'offline' | 'error';
    recentActivity: 'fresh' | 'stale' | 'offline' | 'error';
  };
  
  // Actions
  setDisplayCurrency: (currency: string) => void;
  fetchDashboardData: (currency?: string, forceRefresh?: boolean) => Promise<void>;
  refreshDashboardData: (currency?: string) => Promise<void>;
  clearDashboardData: () => void;
  setError: (error: string | null) => void;
  updateDataFreshness: (key: keyof DashboardState['dataFreshness'], status: 'fresh' | 'stale' | 'offline' | 'error') => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  stats: null,
  monthlySpending: null,
  categorySpending: null,
  upcomingBills: null,
  recentActivity: null,
  displayCurrency: 'USD',
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  
  // Data freshness tracking
  dataFreshness: {
    stats: 'fresh',
    monthlySpending: 'fresh',
    categorySpending: 'fresh',
    upcomingBills: 'fresh',
    recentActivity: 'fresh',
  },
  
  // Set display currency
  setDisplayCurrency: (currency) => {
    set({ displayCurrency: currency });
    // Refetch data with new currency
    get().fetchDashboardData(currency);
  },
  
  // Update data freshness status
  updateDataFreshness: (key, status) => {
    set(state => ({
      dataFreshness: {
        ...state.dataFreshness,
        [key]: status
      }
    }));
  },
  
  // Fetch all dashboard data with improved caching and offline support
  fetchDashboardData: async (currency, forceRefresh = false) => {
    const { isLoading, isRefreshing } = get();
    
    // Don't fetch if already loading (unless refreshing or forced)
    if (isLoading && !isRefreshing && !forceRefresh) return;
    
    const targetCurrency = currency || get().displayCurrency;
    const isOnline = onlineManager.isOnline();
    
    try {
      set({ isLoading: true, error: null });
      
      // Try to get cached data first for immediate UI update
      const [
        cachedStats,
        cachedMonthlySpending,
        cachedCategorySpending,
        cachedUpcomingBills,
        cachedRecentActivity
      ] = await Promise.all([
        cacheStorage.getCacheData<DashboardStats>(`dashboard_stats_${targetCurrency}`),
        cacheStorage.getCacheData<MonthlySpending[]>(`monthly_spending_${targetCurrency}`),
        cacheStorage.getCacheData<CategorySpending[]>(`category_spending_${targetCurrency}`),
        cacheStorage.getCacheData<UpcomingBill[]>(`upcoming_bills_${targetCurrency}`),
        cacheStorage.getCacheData<RecentActivity[]>(`recent_activity_${targetCurrency}`),
      ]);
      
      // Update state with cached data immediately if available
      if (!forceRefresh) {
        set({
          stats: cachedStats || get().stats,
          monthlySpending: cachedMonthlySpending || get().monthlySpending,
          categorySpending: cachedCategorySpending || get().categorySpending,
          upcomingBills: cachedUpcomingBills || get().upcomingBills,
          recentActivity: cachedRecentActivity || get().recentActivity,
        });
      }
      
      // If offline, use cached data and update freshness status
      if (!isOnline) {
        set(state => ({
          dataFreshness: {
            stats: cachedStats ? 'offline' : 'error',
            monthlySpending: cachedMonthlySpending ? 'offline' : 'error',
            categorySpending: cachedCategorySpending ? 'offline' : 'error',
            upcomingBills: cachedUpcomingBills ? 'offline' : 'error',
            recentActivity: cachedRecentActivity ? 'offline' : 'error',
          },
          lastUpdated: cachedStats?.timestamp ? new Date(cachedStats.timestamp) : state.lastUpdated,
        }));
        
        set({ isLoading: false, isRefreshing: false });
        return;
      }
      
      // Fetch all data in parallel with timeout protection
      const fetchPromises = [
        fetchWithTimeout(() => dashboardService.getDashboardStats(targetCurrency)),
        fetchWithTimeout(() => dashboardService.getMonthlySpending(targetCurrency)),
        fetchWithTimeout(() => dashboardService.getCategorySpending(targetCurrency)),
        fetchWithTimeout(() => dashboardService.getUpcomingBills(targetCurrency)),
        fetchWithTimeout(() => dashboardService.getRecentActivity(targetCurrency)),
      ];
      
      const results = await Promise.allSettled(fetchPromises);
      
      // Process results and update state with proper type casting
      const stats = (results[0]?.status === 'fulfilled' ? results[0].value : cachedStats) as DashboardStats | undefined;
      const monthlySpending = (results[1]?.status === 'fulfilled' ? results[1].value : cachedMonthlySpending) as MonthlySpending[] | undefined;
      const categorySpending = (results[2]?.status === 'fulfilled' ? results[2].value : cachedCategorySpending) as CategorySpending[] | undefined;
      const upcomingBills = (results[3]?.status === 'fulfilled' ? results[3].value : cachedUpcomingBills) as UpcomingBill[] | undefined;
      const recentActivity = (results[4]?.status === 'fulfilled' ? results[4].value : cachedRecentActivity) as RecentActivity[] | undefined;
      
      // Cache successful results
      const cachePromises = [];
      if (results[0]?.status === 'fulfilled') {
        cachePromises.push(cacheStorage.setCacheData(`dashboard_stats_${targetCurrency}`, stats, 5)); // 5 minutes
      }
      if (results[1]?.status === 'fulfilled') {
        cachePromises.push(cacheStorage.setCacheData(`monthly_spending_${targetCurrency}`, monthlySpending, 10)); // 10 minutes
      }
      if (results[2]?.status === 'fulfilled') {
        cachePromises.push(cacheStorage.setCacheData(`category_spending_${targetCurrency}`, categorySpending, 10)); // 10 minutes
      }
      if (results[3]?.status === 'fulfilled') {
        cachePromises.push(cacheStorage.setCacheData(`upcoming_bills_${targetCurrency}`, upcomingBills, 5)); // 5 minutes
      }
      if (results[4]?.status === 'fulfilled') {
        cachePromises.push(cacheStorage.setCacheData(`recent_activity_${targetCurrency}`, recentActivity, 5)); // 5 minutes
      }
      
      // Wait for cache operations to complete
      await Promise.allSettled(cachePromises);
      
      // Update data freshness status
      const dataFreshness = {
        stats: (results[0]?.status === 'fulfilled' ? 'fresh' : (cachedStats ? 'stale' : 'error')) as 'fresh' | 'stale' | 'error' | 'offline',
        monthlySpending: (results[1]?.status === 'fulfilled' ? 'fresh' : (cachedMonthlySpending ? 'stale' : 'error')) as 'fresh' | 'stale' | 'error' | 'offline',
        categorySpending: (results[2]?.status === 'fulfilled' ? 'fresh' : (cachedCategorySpending ? 'stale' : 'error')) as 'fresh' | 'stale' | 'error' | 'offline',
        upcomingBills: (results[3]?.status === 'fulfilled' ? 'fresh' : (cachedUpcomingBills ? 'stale' : 'error')) as 'fresh' | 'stale' | 'error' | 'offline',
        recentActivity: (results[4]?.status === 'fulfilled' ? 'fresh' : (cachedRecentActivity ? 'stale' : 'error')) as 'fresh' | 'stale' | 'error' | 'offline',
      };
      
      // Update state with fetched data
      set({
        stats: stats || null,
        monthlySpending: monthlySpending || null,
        categorySpending: categorySpending || null,
        upcomingBills: upcomingBills || null,
        recentActivity: recentActivity || null,
        lastUpdated: new Date(),
        dataFreshness,
      });
      
      // Update React Query cache for components using hooks
      if (stats) {
        queryClient.setQueryData(queryKeys.dashboard.stats(targetCurrency), stats);
      }
      if (monthlySpending) {
        queryClient.setQueryData(queryKeys.analytics.monthly(targetCurrency), monthlySpending);
      }
      if (categorySpending) {
        queryClient.setQueryData(queryKeys.analytics.categories(targetCurrency), categorySpending);
      }
      if (upcomingBills) {
        queryClient.setQueryData(queryKeys.dashboard.upcoming(targetCurrency), upcomingBills);
      }
      if (recentActivity) {
        queryClient.setQueryData(queryKeys.dashboard.activity(), recentActivity);
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' });
      
      // Update data freshness to error or stale
      set(state => ({
        dataFreshness: {
          stats: state.stats ? 'stale' : 'error',
          monthlySpending: state.monthlySpending ? 'stale' : 'error',
          categorySpending: state.categorySpending ? 'stale' : 'error',
          upcomingBills: state.upcomingBills ? 'stale' : 'error',
          recentActivity: state.recentActivity ? 'stale' : 'error',
        }
      }));
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },
  
  // Refresh dashboard data (for pull-to-refresh)
  refreshDashboardData: async (currency) => {
    set({ isRefreshing: true });
    await get().fetchDashboardData(currency, true); // Force refresh
  },
  
  // Clear dashboard data
  clearDashboardData: () => {
    set({
      stats: null,
      monthlySpending: null,
      categorySpending: null,
      upcomingBills: null,
      recentActivity: null,
      lastUpdated: null,
      dataFreshness: {
        stats: 'fresh',
        monthlySpending: 'fresh',
        categorySpending: 'fresh',
        upcomingBills: 'fresh',
        recentActivity: 'fresh',
      },
    });
    
    // Clear cache
    const { displayCurrency } = get();
    Promise.all([
      cacheStorage.clearCache(`dashboard_stats_${displayCurrency}`),
      cacheStorage.clearCache(`monthly_spending_${displayCurrency}`),
      cacheStorage.clearCache(`category_spending_${displayCurrency}`),
      cacheStorage.clearCache(`upcoming_bills_${displayCurrency}`),
      cacheStorage.clearCache(`recent_activity_${displayCurrency}`),
    ]).catch(error => {
      console.error('Failed to clear dashboard cache:', error);
    });
    
    // Clear React Query cache
    invalidateQueries.dashboard();
  },
  
  // Set error
  setError: (error) => {
    set({ error });
  },
}));

// Helper function to fetch with timeout
const fetchWithTimeout = async <T>(fetchFn: () => Promise<T>, timeoutMs = 10000): Promise<T> => {
  return new Promise<T>(async (resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);
    
    try {
      // Execute fetch
      const result = await fetchFn();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

// Helper function to initialize dashboard data
export const initializeDashboardData = async (currency?: string): Promise<void> => {
  const dashboardStore = useDashboardStore.getState();
  await dashboardStore.fetchDashboardData(currency);
};

// Register background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const dashboardStore = useDashboardStore.getState();
    
    // Only refresh if online
    if (onlineManager.isOnline()) {
      await dashboardStore.fetchDashboardData(undefined, false);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Helper function to register background refresh
export const registerBackgroundRefresh = async (): Promise<void> => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes minimum
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
  } catch (error) {
    console.error('Failed to register background fetch:', error);
  }
};

// Helper function to schedule background refresh
export const setupDashboardBackgroundRefresh = (intervalMinutes = 5): () => void => {
  // Register app state change listener for foreground refresh
  const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, refresh data
      const dashboardStore = useDashboardStore.getState();
      if (!dashboardStore.isLoading && !dashboardStore.isRefreshing) {
        dashboardStore.fetchDashboardData();
      }
    }
  });
  
  // Also set up interval for regular updates while app is open
  const intervalId = setInterval(() => {
    const dashboardStore = useDashboardStore.getState();
    
    // Only refresh if not currently loading and app is active
    if (!dashboardStore.isLoading && !dashboardStore.isRefreshing && AppState.currentState === 'active') {
      dashboardStore.fetchDashboardData();
    }
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    subscription.remove();
    clearInterval(intervalId);
  };
};

// Helper function to manually trigger background refresh
export const triggerBackgroundRefresh = async (): Promise<boolean> => {
  try {
    const result = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (result) {
      // Use the correct method name for background fetch
      try {
        await (BackgroundFetch as any).executeTaskAsync?.(BACKGROUND_FETCH_TASK);
      } catch (error) {
        // Fallback to setting minimum interval
        await BackgroundFetch.setMinimumIntervalAsync(15000); // 15 seconds minimum
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to trigger background refresh:', error);
    return false;
  }
};