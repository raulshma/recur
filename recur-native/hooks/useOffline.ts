import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineStore } from '@/store/offlineStore';

export const useOffline = () => {
  const networkStatus = useNetworkStatus();
  const {
    isOnline,
    pendingActions,
    syncInProgress,
    lastSyncTime,
    error,
    setOnlineStatus,
    loadPendingActions,
    syncPendingActions,
    addPendingAction,
    clearPendingActions,
  } = useOfflineStore();

  // Sync network status with offline store
  useEffect(() => {
    setOnlineStatus(networkStatus.isConnected && networkStatus.isOnline);
  }, [networkStatus.isConnected, networkStatus.isOnline, setOnlineStatus]);

  // Load pending actions on mount
  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !syncInProgress) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length, syncInProgress, syncPendingActions]);

  return {
    // Network status
    isOnline,
    isConnected: networkStatus.isConnected,
    lastNetworkCheck: networkStatus.lastChecked,
    
    // Offline state
    pendingActions,
    pendingActionsCount: pendingActions.length,
    syncInProgress,
    lastSyncTime,
    error,
    
    // Actions
    addPendingAction,
    syncPendingActions,
    clearPendingActions,
    checkConnectivity: networkStatus.checkConnectivity,
  };
};