import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { useAppSettingsStore } from '@/store/appSettingsStore';

// Hook for fetching dashboard stats
export const useDashboardStats = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.dashboard.stats(targetCurrency),
    queryFn: () => dashboardService.getDashboardStats(targetCurrency),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => dashboardService.getNotifications(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for fetching monthly spending
export const useMonthlySpending = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.analytics.monthly(targetCurrency),
    queryFn: () => dashboardService.getMonthlySpending(targetCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching category spending
export const useCategorySpending = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.analytics.categories(targetCurrency),
    queryFn: () => dashboardService.getCategorySpending(targetCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching upcoming bills
export const useUpcomingBills = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.dashboard.upcoming(targetCurrency),
    queryFn: () => dashboardService.getUpcomingBills(targetCurrency),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching recent activity
export const useRecentActivity = (currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => dashboardService.getRecentActivity(targetCurrency),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching analytics overview
export const useAnalyticsOverview = (timeRange: string, currency?: string) => {
  const { currency: defaultCurrency } = useAppSettingsStore();
  const targetCurrency = currency || defaultCurrency;

  return useQuery({
    queryKey: queryKeys.analytics.overview(timeRange, targetCurrency),
    queryFn: () => dashboardService.getAnalyticsOverview(timeRange, targetCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!timeRange,
  });
};