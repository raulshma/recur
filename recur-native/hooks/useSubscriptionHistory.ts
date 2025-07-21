import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { useNetworkStatus } from './useNetworkStatus';
import { processSubscriptionHistory } from '@/utils/subscriptionUtils';
import { useMemo } from 'react';

/**
 * Hook for fetching and processing subscription history
 * @param id Subscription ID
 * @returns Processed subscription history with readable changes
 */
export const useSubscriptionHistory = (id: number) => {
  const { isOnline } = useNetworkStatus();
  
  // Fetch raw history data
  const historyQuery = useQuery({
    queryKey: queryKeys.subscriptions.history(id),
    queryFn: () => subscriptionService.getSubscriptionHistory(id),
    enabled: !!id && isOnline,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Process history data into a more readable format
  const processedHistory = useMemo(() => {
    if (!historyQuery.data) return [];
    return processSubscriptionHistory(historyQuery.data);
  }, [historyQuery.data]);
  
  return {
    ...historyQuery,
    processedHistory,
  };
};

/**
 * Hook for tracking recent changes to a subscription
 * @param id Subscription ID
 * @returns Most recent changes (up to 3)
 */
export const useRecentSubscriptionChanges = (id: number) => {
  const { processedHistory, ...historyQuery } = useSubscriptionHistory(id);
  
  // Get the most recent changes (up to 3)
  const recentChanges = useMemo(() => {
    return processedHistory.slice(0, 3);
  }, [processedHistory]);
  
  return {
    ...historyQuery,
    recentChanges,
  };
};