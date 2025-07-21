import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/api';
import { queryKeys, invalidateQueries } from '@/services/queryClient';
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionFilters,
  SubscriptionHistory,
} from '@/types';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useCallback, useMemo } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from './useOfflineSync';

// Hook for fetching subscriptions with filters and search
export const useSubscriptions = (customFilters?: SubscriptionFilters) => {
  const { filters: storeFilters, searchQuery, pendingChanges } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  
  // Merge store filters with custom filters
  const mergedFilters = useMemo(() => {
    const filters = { ...storeFilters, ...customFilters };
    // Add search query to filters if it exists
    if (searchQuery) {
      filters.search = searchQuery;
    }
    return filters;
  }, [storeFilters, customFilters, searchQuery]);
  
  // Fetch subscriptions with merged filters
  const queryResult = useQuery({
    queryKey: queryKeys.subscriptions.list(mergedFilters),
    queryFn: () => subscriptionService.getSubscriptions(mergedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Don't refetch if offline
    enabled: isOnline,
  });
  
  // Apply optimistic updates to the subscription data
  const optimisticData = useMemo(() => {
    if (!queryResult.data) return undefined;
    
    return queryResult.data.map(subscription => {
      const pendingChange = pendingChanges.get(subscription.id);
      if (pendingChange) {
        return { ...subscription, ...pendingChange };
      }
      return subscription;
    });
  }, [queryResult.data, pendingChanges]);
  
  // Return the query result with optimistic data
  return {
    ...queryResult,
    data: optimisticData || queryResult.data,
  };
};

// Hook for filtering and searching subscriptions
export const useSubscriptionFilters = () => {
  const { 
    filters, 
    setFilters, 
    searchQuery, 
    setSearchQuery 
  } = useSubscriptionStore();
  
  // Apply a filter
  const applyFilter = useCallback((key: keyof SubscriptionFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);
  
  // Clear a specific filter
  const clearFilter = useCallback((key: keyof SubscriptionFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  }, [filters, setFilters]);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);
  
  // Set search query
  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);
  
  return {
    filters,
    searchQuery,
    applyFilter,
    clearFilter,
    clearAllFilters,
    search,
  };
};

// Hook for fetching a single subscription with optimistic updates
export const useSubscription = (id: number) => {
  const { pendingChanges } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  
  const queryResult = useQuery({
    queryKey: queryKeys.subscriptions.detail(id),
    queryFn: () => subscriptionService.getSubscription(id),
    enabled: !!id && isOnline,
  });
  
  // Apply optimistic updates if they exist
  const optimisticData = useMemo(() => {
    if (!queryResult.data) return undefined;
    
    const pendingChange = pendingChanges.get(id);
    if (pendingChange) {
      return { ...queryResult.data, ...pendingChange };
    }
    return queryResult.data;
  }, [queryResult.data, pendingChanges, id]);
  
  return {
    ...queryResult,
    data: optimisticData || queryResult.data,
  };
};

// Hook for fetching subscription history
export const useSubscriptionHistory = (id: number) => {
  const { isOnline } = useNetworkStatus();
  
  return useQuery({
    queryKey: queryKeys.subscriptions.history(id),
    queryFn: () => subscriptionService.getSubscriptionHistory(id),
    enabled: !!id && isOnline,
  });
};

// Hook for creating a subscription with optimistic updates
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { addPendingOperation } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  const { syncOperation } = useOfflineSync();
  
  return useMutation({
    mutationFn: (data: CreateSubscriptionDto) => {
      // If offline, queue the operation and throw an error to trigger onError
      if (!isOnline) {
        addPendingOperation({ type: 'create', data });
        return Promise.reject(new Error('Offline - Operation queued'));
      }
      return subscriptionService.createSubscription(data);
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.lists() });
      
      // Return context for potential rollback
      return { data };
    },
    onSuccess: (newSubscription) => {
      invalidateQueries.subscriptions();
      
      // Sync the successful operation
      syncOperation('create', newSubscription.id);
    },
    onError: (error, data, context) => {
      console.error('Failed to create subscription:', error);
      
      // If we're offline, inform the user that the operation is queued
      if (!isOnline) {
        console.log('Operation queued for when online');
        return;
      }
      
      // Otherwise, it's a real error
    },
  });
};

// Hook for updating a subscription with optimistic updates
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  const { addPendingChange, removePendingChange, addPendingOperation } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  const { syncOperation } = useOfflineSync();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubscriptionDto }) => {
      // If offline, queue the operation and throw an error to trigger onError
      if (!isOnline) {
        addPendingOperation({ type: 'update', id, data });
        return Promise.reject(new Error('Offline - Operation queued'));
      }
      return subscriptionService.updateSubscription(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.lists() });
      
      // Apply optimistic update
      addPendingChange(id, data);
      
      // Return context for potential rollback
      return { id, data, previousData: queryClient.getQueryData(queryKeys.subscriptions.detail(id)) };
    },
    onSuccess: (_, { id }) => {
      // Remove the pending change since it's now committed
      removePendingChange(id);
      
      // Invalidate related queries
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      
      // Sync the successful operation
      syncOperation('update', id);
    },
    onError: (error, { id, data }, context) => {
      console.error('Failed to update subscription:', error);
      
      // If we're offline, keep the optimistic update
      if (!isOnline) {
        console.log('Operation queued for when online');
        return;
      }
      
      // Otherwise, roll back the optimistic update
      removePendingChange(id);
      
      // Restore previous data if available
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.subscriptions.detail(id), context.previousData);
      }
    },
  });
};

// Hook for deleting a subscription with optimistic updates
export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  const { addPendingChange, addPendingOperation } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  const { syncOperation } = useOfflineSync();
  
  return useMutation({
    mutationFn: (id: number) => {
      // If offline, queue the operation and throw an error to trigger onError
      if (!isOnline) {
        addPendingOperation({ type: 'delete', id });
        return Promise.reject(new Error('Offline - Operation queued'));
      }
      return subscriptionService.deleteSubscription(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.lists() });
      
      // Get the current data for potential rollback
      const previousData = queryClient.getQueryData(queryKeys.subscriptions.detail(id));
      const previousList = queryClient.getQueryData(queryKeys.subscriptions.lists());
      
      // Apply optimistic update - mark as deleted
      addPendingChange(id, { isDeleted: true });
      
      // Update the list data to remove this subscription
      if (previousList) {
        queryClient.setQueryData(
          queryKeys.subscriptions.lists(),
          (old: Subscription[] | undefined) => 
            old ? old.filter(sub => sub.id !== id) : []
        );
      }
      
      // Return context for potential rollback
      return { id, previousData, previousList };
    },
    onSuccess: (_, id) => {
      // Remove queries for this subscription
      queryClient.removeQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      
      // Invalidate lists
      invalidateQueries.subscriptions();
      
      // Sync the successful operation
      syncOperation('delete', id);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete subscription:', error);
      
      // If we're offline, keep the optimistic update
      if (!isOnline) {
        console.log('Operation queued for when online');
        return;
      }
      
      // Otherwise, roll back the optimistic updates
      if (context) {
        // Restore the detail data
        if (context.previousData) {
          queryClient.setQueryData(queryKeys.subscriptions.detail(id), context.previousData);
        }
        
        // Restore the list data
        if (context.previousList) {
          queryClient.setQueryData(queryKeys.subscriptions.lists(), context.previousList);
        }
      }
    },
  });
};

// Hook for cancelling a subscription with optimistic updates
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { addPendingChange, removePendingChange, addPendingOperation } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  const { syncOperation } = useOfflineSync();
  
  return useMutation({
    mutationFn: (id: number) => {
      // If offline, queue the operation and throw an error to trigger onError
      if (!isOnline) {
        addPendingOperation({ type: 'cancel', id });
        return Promise.reject(new Error('Offline - Operation queued'));
      }
      return subscriptionService.cancelSubscription(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.lists() });
      
      // Apply optimistic update
      const now = new Date();
      addPendingChange(id, { 
        isActive: false, 
        cancellationDate: now 
      });
      
      // Return context for potential rollback
      return { 
        id, 
        previousData: queryClient.getQueryData(queryKeys.subscriptions.detail(id)) 
      };
    },
    onSuccess: (_, id) => {
      // Remove the pending change since it's now committed
      removePendingChange(id);
      
      // Invalidate related queries
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      
      // Sync the successful operation
      syncOperation('cancel', id);
    },
    onError: (error, id, context) => {
      console.error('Failed to cancel subscription:', error);
      
      // If we're offline, keep the optimistic update
      if (!isOnline) {
        console.log('Operation queued for when online');
        return;
      }
      
      // Otherwise, roll back the optimistic update
      removePendingChange(id);
      
      // Restore previous data if available
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.subscriptions.detail(id), context.previousData);
      }
    },
  });
};

// Hook for reactivating a subscription with optimistic updates
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();
  const { addPendingChange, removePendingChange, addPendingOperation } = useSubscriptionStore();
  const { isOnline } = useNetworkStatus();
  const { syncOperation } = useOfflineSync();
  
  return useMutation({
    mutationFn: (id: number) => {
      // If offline, queue the operation and throw an error to trigger onError
      if (!isOnline) {
        addPendingOperation({ type: 'reactivate', id });
        return Promise.reject(new Error('Offline - Operation queued'));
      }
      return subscriptionService.reactivateSubscription(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.lists() });
      
      // Apply optimistic update
      addPendingChange(id, { 
        isActive: true, 
        cancellationDate: null 
      });
      
      // Return context for potential rollback
      return { 
        id, 
        previousData: queryClient.getQueryData(queryKeys.subscriptions.detail(id)) 
      };
    },
    onSuccess: (_, id) => {
      // Remove the pending change since it's now committed
      removePendingChange(id);
      
      // Invalidate related queries
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
      
      // Sync the successful operation
      syncOperation('reactivate', id);
    },
    onError: (error, id, context) => {
      console.error('Failed to reactivate subscription:', error);
      
      // If we're offline, keep the optimistic update
      if (!isOnline) {
        console.log('Operation queued for when online');
        return;
      }
      
      // Otherwise, roll back the optimistic update
      removePendingChange(id);
      
      // Restore previous data if available
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.subscriptions.detail(id), context.previousData);
      }
    },
  });
};