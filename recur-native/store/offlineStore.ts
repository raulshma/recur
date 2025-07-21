import { create } from 'zustand';
import { offlineStorage } from '@/services/storage';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'subscription' | 'category' | 'user';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineState {
  // State
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  lastSyncTime: Date | null;
  error: string | null;

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  addPendingAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  removePendingAction: (actionId: string) => Promise<void>;
  loadPendingActions: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => Promise<void>;
  setError: (error: string | null) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // Initial state
  isOnline: true,
  pendingActions: [],
  syncInProgress: false,
  lastSyncTime: null,
  error: null,

  // Actions
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
    
    // If we just came online, sync pending actions
    if (isOnline && !get().syncInProgress) {
      get().syncPendingActions();
    }
  },

  addPendingAction: async (actionData) => {
    const action: OfflineAction = {
      ...actionData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: actionData.maxRetries || 3,
    };

    try {
      // Store in persistent storage
      await offlineStorage.storeOfflineAction(action);
      
      // Update state
      set(state => ({
        pendingActions: [...state.pendingActions, action],
      }));
    } catch (error) {
      console.error('Failed to store offline action:', error);
      set({ error: 'Failed to store offline action' });
    }
  },

  removePendingAction: async (actionId) => {
    try {
      // Remove from persistent storage
      await offlineStorage.removeOfflineAction(actionId);
      
      // Update state
      set(state => ({
        pendingActions: state.pendingActions.filter(action => action.id !== actionId),
      }));
    } catch (error) {
      console.error('Failed to remove offline action:', error);
    }
  },

  loadPendingActions: async () => {
    try {
      const actions = await offlineStorage.getOfflineActions();
      set({ pendingActions: actions });
    } catch (error) {
      console.error('Failed to load pending actions:', error);
      set({ error: 'Failed to load pending actions' });
    }
  },

  syncPendingActions: async () => {
    const { pendingActions, isOnline, syncInProgress } = get();
    
    if (!isOnline || syncInProgress || pendingActions.length === 0) {
      return;
    }

    set({ syncInProgress: true, error: null });

    try {
      const { authService, subscriptionService, categoryService } = await import('@/services/api');
      
      for (const action of pendingActions) {
        try {
          let success = false;

          // Execute the action based on type and entity
          switch (action.entity) {
            case 'subscription':
              success = await syncSubscriptionAction(action, subscriptionService);
              break;
            case 'category':
              success = await syncCategoryAction(action, categoryService);
              break;
            case 'user':
              success = await syncUserAction(action, authService);
              break;
          }

          if (success) {
            await get().removePendingAction(action.id);
          } else {
            // Increment retry count
            const updatedAction = {
              ...action,
              retryCount: action.retryCount + 1,
            };

            if (updatedAction.retryCount >= updatedAction.maxRetries) {
              // Max retries reached, remove action
              await get().removePendingAction(action.id);
              console.warn(`Action ${action.id} failed after ${action.maxRetries} retries`);
            } else {
              // Update retry count in storage
              await offlineStorage.storeOfflineAction(updatedAction);
              set(state => ({
                pendingActions: state.pendingActions.map(a => 
                  a.id === action.id ? updatedAction : a
                ),
              }));
            }
          }
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      set({ lastSyncTime: new Date() });
    } catch (error) {
      console.error('Sync failed:', error);
      set({ error: 'Sync failed' });
    } finally {
      set({ syncInProgress: false });
    }
  },

  clearPendingActions: async () => {
    try {
      await offlineStorage.clearOfflineActions();
      set({ pendingActions: [] });
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
      set({ error: 'Failed to clear pending actions' });
    }
  },

  setError: (error) => {
    set({ error });
  },

  setSyncInProgress: (syncInProgress) => {
    set({ syncInProgress });
  },
}));

// Helper functions for syncing different types of actions
async function syncSubscriptionAction(action: OfflineAction, subscriptionService: any): Promise<boolean> {
  try {
    switch (action.type) {
      case 'create':
        await subscriptionService.createSubscription(action.data);
        return true;
      case 'update':
        await subscriptionService.updateSubscription(action.data.id, action.data);
        return true;
      case 'delete':
        await subscriptionService.deleteSubscription(action.data.id);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Failed to sync subscription action:', error);
    return false;
  }
}

async function syncCategoryAction(action: OfflineAction, categoryService: any): Promise<boolean> {
  try {
    switch (action.type) {
      case 'create':
        await categoryService.createCategory(action.data);
        return true;
      case 'update':
        await categoryService.updateCategory(action.data.id, action.data);
        return true;
      case 'delete':
        await categoryService.deleteCategory(action.data.id);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Failed to sync category action:', error);
    return false;
  }
}

async function syncUserAction(action: OfflineAction, authService: any): Promise<boolean> {
  try {
    switch (action.type) {
      case 'update':
        await authService.updateProfile(action.data);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Failed to sync user action:', error);
    return false;
  }
}