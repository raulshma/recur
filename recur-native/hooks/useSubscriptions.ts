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

// Hook for fetching subscriptions with filters
export const useSubscriptions = (filters?: SubscriptionFilters) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.list(filters),
    queryFn: () => subscriptionService.getSubscriptions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single subscription
export const useSubscription = (id: number) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.detail(id),
    queryFn: () => subscriptionService.getSubscription(id),
    enabled: !!id,
  });
};

// Hook for fetching subscription history
export const useSubscriptionHistory = (id: number) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.history(id),
    queryFn: () => subscriptionService.getSubscriptionHistory(id),
    enabled: !!id,
  });
};

// Hook for creating a subscription
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionDto) => subscriptionService.createSubscription(data),
    onSuccess: () => {
      invalidateQueries.subscriptions();
    },
    onError: (error) => {
      console.error('Failed to create subscription:', error);
    },
  });
};

// Hook for updating a subscription
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubscriptionDto }) =>
      subscriptionService.updateSubscription(id, data),
    onSuccess: (_, { id }) => {
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to update subscription:', error);
    },
  });
};

// Hook for deleting a subscription
export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subscriptionService.deleteSubscription(id),
    onSuccess: (_, id) => {
      invalidateQueries.subscriptions();
      queryClient.removeQueries({ queryKey: queryKeys.subscriptions.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to delete subscription:', error);
    },
  });
};

// Hook for cancelling a subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subscriptionService.cancelSubscription(id),
    onSuccess: (_, id) => {
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to cancel subscription:', error);
    },
  });
};

// Hook for reactivating a subscription
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subscriptionService.reactivateSubscription(id),
    onSuccess: (_, id) => {
      invalidateQueries.subscriptions();
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to reactivate subscription:', error);
    },
  });
};