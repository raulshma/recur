import { useCallback, useEffect, useState } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { offlineStorage } from '@/services/storage';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { subscriptionService } from '@/services/api';
import { queryKeys, invalidateQueries } from '@/services/queryClient';
import NetInfo from '@react-native-community/netinfo';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '@/types';

// Define types for offline actions
interface OfflineAction {
  id: string;
  type: string;
  entityType?: string;
  entityId?: number;
  data?: any;
  timestamp: number;
}

/**
 * Hook for managing offline data synchronization
 * @returns Offline sync utilities and state
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  
  const queryClient = useQueryClient();
  const dashboardStore = useDashboardStore();
  const { currency } = useAppSettingsStore();
  const { removePendingChange, clearPendingOperations } = useSubscriptionStore();
  
  // Load pending actions on mount
  useEffect(() => {
    const loadPendingActions = async () => {
      const actions = await offlineStorage.getOfflineActions();
      setPendingActions(actions);
      
      // Get last sync time
      const lastSync = await storage.getItem('last_sync_time');
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    };
    
    loadPendingActions();
    
    // Set up network state listener
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      onlineManager.setOnline(online);
      
      // Trigger sync when coming back online
      if (online && !isOnline) {
        syncOfflineData();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Sync a specific operation (used after successful API calls)
  const syncOperation = useCallback((operationType: string, entityId?: number) => {
    // This is a no-op for now, but could be used to track successful operations
    // and remove them from the pending operations list
  }, []);
  
  // Sync offline data when coming back online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Get pending actions
      const actions = await offlineStorage.getOfflineActions();
      
      if (actions.length === 0) {
        // Just refresh dashboard data
        await dashboardStore.refreshDashboardData(currency);
        setLastSyncTime(new Date());
        await storage.setItem('last_sync_time', new Date().toISOString());
        return;
      }
      
      // Process each pending action
      for (const action of actions) {
        try {
          // Process based on action type
          switch (action.type) {
            case 'subscription.create':
              if (action.data) {
                const newSubscription = await subscriptionService.createSubscription(
                  action.data as CreateSubscriptionDto
                );
                invalidateQueries.subscriptions();
              }
              break;
              
            case 'subscription.update':
              if (action.entityId && action.data) {
                await subscriptionService.updateSubscription(
                  action.entityId,
                  action.data as UpdateSubscriptionDto
                );
                invalidateQueries.subscriptions();
                queryClient.invalidateQueries({ 
                  queryKey: queryKeys.subscriptions.detail(action.entityId) 
                });
                // Remove any pending changes for this subscription
                removePendingChange(action.entityId);
              }
              break;
              
            case 'subscription.delete':
              if (action.entityId) {
                await subscriptionService.deleteSubscription(action.entityId);
                invalidateQueries.subscriptions();
                queryClient.removeQueries({ 
                  queryKey: queryKeys.subscriptions.detail(action.entityId) 
                });
              }
              break;
              
            case 'subscription.cancel':
              if (action.entityId) {
                await subscriptionService.cancelSubscription(action.entityId);
                invalidateQueries.subscriptions();
                queryClient.invalidateQueries({ 
                  queryKey: queryKeys.subscriptions.detail(action.entityId) 
                });
                // Remove any pending changes for this subscription
                removePendingChange(action.entityId);
              }
              break;
              
            case 'subscription.reactivate':
              if (action.entityId) {
                await subscriptionService.reactivateSubscription(action.entityId);
                invalidateQueries.subscriptions();
                queryClient.invalidateQueries({ 
                  queryKey: queryKeys.subscriptions.detail(action.entityId) 
                });
                // Remove any pending changes for this subscription
                removePendingChange(action.entityId);
              }
              break;
              
            default:
              console.warn('Unknown offline action type:', action.type);
          }
          
          // Remove processed action
          await offlineStorage.removeOfflineAction(action.id);
        } catch (actionError) {
          console.error('Failed to process offline action:', actionError);
        }
      }
      
      // Clear any remaining pending operations from the subscription store
      clearPendingOperations();
      
      // Refresh dashboard data after processing actions
      await dashboardStore.refreshDashboardData(currency);
      
      // Update pending actions
      const remainingActions = await offlineStorage.getOfflineActions();
      setPendingActions(remainingActions);
      
      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      await storage.setItem('last_sync_time', now.toISOString());
      
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, dashboardStore, currency, queryClient, removePendingChange, clearPendingOperations]);
  
  // Queue an action for offline processing
  const queueOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    try {
      // Generate unique ID for the action
      const actionWithId = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now()
      };
      
      // Store in offline queue
      await offlineStorage.storeOfflineAction(actionWithId);
      
      // Update pending actions
      const actions = await offlineStorage.getOfflineActions();
      setPendingActions(actions);
      
      return true;
    } catch (error) {
      console.error('Failed to queue offline action:', error);
      return false;
    }
  }, []);
  
  // Clear all pending actions
  const clearPendingActions = useCallback(async () => {
    try {
      await offlineStorage.clearOfflineActions();
      setPendingActions([]);
      return true;
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
      return false;
    }
  }, []);
  
  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      return false;
    }
    
    return syncOfflineData();
  }, [isOnline, syncOfflineData]);
  
  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingActions,
    pendingActionsCount: pendingActions.length,
    syncOfflineData,
    queueOfflineAction,
    clearPendingActions,
    triggerSync,
    syncOperation
  };
};

// Import storage for internal use
import { storage } from '@/services/storage';