import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subscription, SubscriptionFilters } from '@/types';

interface SubscriptionState {
  // Current active filters
  filters: SubscriptionFilters;
  // Search query
  searchQuery: string;
  // Optimistic updates cache
  pendingChanges: Map<number, Partial<Subscription>>;
  // Pending operations for offline support
  pendingOperations: Array<{
    type: 'create' | 'update' | 'delete' | 'cancel' | 'reactivate';
    id?: number;
    data?: any;
    timestamp: number;
  }>;
  // Selected subscription for detail view
  selectedSubscriptionId: number | null;
  // Actions
  setFilters: (filters: SubscriptionFilters) => void;
  setSearchQuery: (query: string) => void;
  addPendingChange: (id: number, changes: Partial<Subscription>) => void;
  removePendingChange: (id: number) => void;
  addPendingOperation: (operation: {
    type: 'create' | 'update' | 'delete' | 'cancel' | 'reactivate';
    id?: number;
    data?: any;
  }) => void;
  removePendingOperation: (index: number) => void;
  clearPendingOperations: () => void;
  setSelectedSubscriptionId: (id: number | null) => void;
  // Helper methods
  getOptimisticSubscription: (subscription: Subscription) => Subscription;
  clearAll: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: {},
      searchQuery: '',
      pendingChanges: new Map(),
      pendingOperations: [],
      selectedSubscriptionId: null,

      // Actions
      setFilters: (filters) => set({ filters }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      addPendingChange: (id, changes) => 
        set((state) => {
          const newPendingChanges = new Map(state.pendingChanges);
          newPendingChanges.set(id, { 
            ...(newPendingChanges.get(id) || {}), 
            ...changes 
          });
          return { pendingChanges: newPendingChanges };
        }),
      
      removePendingChange: (id) => 
        set((state) => {
          const newPendingChanges = new Map(state.pendingChanges);
          newPendingChanges.delete(id);
          return { pendingChanges: newPendingChanges };
        }),
      
      addPendingOperation: (operation) => 
        set((state) => ({
          pendingOperations: [
            ...state.pendingOperations,
            { ...operation, timestamp: Date.now() }
          ]
        })),
      
      removePendingOperation: (index) => 
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((_, i) => i !== index)
        })),
      
      clearPendingOperations: () => set({ pendingOperations: [] }),
      
      setSelectedSubscriptionId: (id) => set({ selectedSubscriptionId: id }),
      
      // Helper methods
      getOptimisticSubscription: (subscription) => {
        const pendingChanges = get().pendingChanges.get(subscription.id);
        if (!pendingChanges) return subscription;
        
        return {
          ...subscription,
          ...pendingChanges
        };
      },
      
      clearAll: () => set({
        filters: {},
        searchQuery: '',
        pendingChanges: new Map(),
        pendingOperations: [],
        selectedSubscriptionId: null
      })
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filters: state.filters,
        searchQuery: state.searchQuery,
        pendingOperations: state.pendingOperations,
        // Don't persist pendingChanges as they're handled by React Query
        // Don't persist selectedSubscriptionId as it's UI state
      }),
      // Custom serialization/deserialization for Map objects
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).pendingChanges)) {
          state.pendingChanges = new Map((state as any).pendingChanges);
        }
      }
    }
  )
);