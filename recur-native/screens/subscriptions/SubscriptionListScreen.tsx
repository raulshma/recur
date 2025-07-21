import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/config';
import { Subscription } from '@/types';
import { Button } from '@/components/common';
import { SubscriptionStatusBadge, NextBillingCountdown, VirtualizedSubscriptionList } from '@/components/subscriptions';
import { useSubscriptions, useSubscriptionFilters, useCancelSubscription, useDeleteSubscription, useReactivateSubscription } from '@/hooks/useSubscriptions';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';

export const SubscriptionListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, searchQuery, applyFilter, clearFilter, clearAllFilters, search } = useSubscriptionFilters();
  const { setSelectedSubscriptionId } = useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Get subscriptions with current filters
  const { data: subscriptions, isLoading, refetch } = useSubscriptions();

  // Mutation hooks
  const { mutate: cancelSubscription } = useCancelSubscription();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { mutate: reactivateSubscription } = useReactivateSubscription();

  // Handle subscription selection
  const handleSelectSubscription = useCallback((subscription: Subscription) => {
    setSelectedSubscriptionId(subscription.id);
    router.push(`/subscriptions/${subscription.id}`);
  }, [router, setSelectedSubscriptionId]);

  // Handle edit subscription
  const handleEditSubscription = useCallback((subscription: Subscription) => {
    router.push({
      pathname: '/modals/edit-subscription',
      params: { subscriptionId: subscription.id }
    });
  }, [router]);

  // Handle cancel subscription
  const handleCancelSubscription = useCallback((subscription: Subscription) => {
    cancelSubscription(subscription.id);
  }, [cancelSubscription]);

  // Handle delete subscription
  const handleDeleteSubscription = useCallback((subscription: Subscription) => {
    deleteSubscription(subscription.id);
  }, [deleteSubscription]);

  // Handle reactivate subscription
  const handleReactivateSubscription = useCallback((subscription: Subscription) => {
    reactivateSubscription(subscription.id);
  }, [reactivateSubscription]);

  // Handle add subscription
  const handleAddSubscription = useCallback(() => {
    router.push('/modals/add-subscription');
  }, [router]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Toggle filter visibility
  const toggleFilters = useCallback(() => {
    setFilterVisible(prev => !prev);
  }, []);

  // Apply active filter
  const handleFilterActive = useCallback(() => {
    applyFilter('isActive', true);
  }, [applyFilter]);

  // Apply inactive filter
  const handleFilterInactive = useCallback(() => {
    applyFilter('isActive', false);
  }, [applyFilter]);

  // Apply trial filter
  const handleFilterTrial = useCallback(() => {
    applyFilter('isTrial', true);
  }, [applyFilter]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    clearAllFilters();
    setFilterVisible(false);
  }, [clearAllFilters]);

  // These functions are now passed directly to the VirtualizedSubscriptionList component

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <TouchableOpacity onPress={handleAddSubscription} style={styles.addButton}>
          <Ionicons name="add" size={24} color={THEME.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={THEME.COLORS.TEXT_SECONDARY} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subscriptions..."
            placeholderTextColor={THEME.COLORS.TEXT_SECONDARY}
            value={searchQuery}
            onChangeText={search}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => search('')}>
              <Ionicons name="close-circle" size={20} color={THEME.COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={toggleFilters} style={styles.filterButton}>
          <Ionicons 
            name="filter" 
            size={20} 
            color={Object.keys(filters).length > 0 ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY} 
          />
        </TouchableOpacity>
      </View>

      {filterVisible && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.isActive === true && styles.activeFilterChip,
              ]}
              onPress={handleFilterActive}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.isActive === true && styles.activeFilterChipText,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.isActive === false && styles.activeFilterChip,
              ]}
              onPress={handleFilterInactive}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.isActive === false && styles.activeFilterChipText,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.isTrial === true && styles.activeFilterChip,
              ]}
              onPress={handleFilterTrial}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.isTrial === true && styles.activeFilterChipText,
                ]}
              >
                Trial
              </Text>
            </TouchableOpacity>
          </View>
          {Object.keys(filters).length > 0 && (
            <Button
              title="Clear Filters"
              onPress={handleClearFilters}
              variant="outline"
              size="small"
            />
          )}
        </View>
      )}

      <VirtualizedSubscriptionList
        subscriptions={subscriptions}
        isLoading={isLoading}
        onSelectSubscription={handleSelectSubscription}
        onEditSubscription={handleEditSubscription}
        onCancelSubscription={handleCancelSubscription}
        onDeleteSubscription={handleDeleteSubscription}
        onReactivateSubscription={handleReactivateSubscription}
        onAddSubscription={handleAddSubscription}
        searchQuery={searchQuery}
        hasFilters={Object.keys(filters).length > 0}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.LG,
    paddingVertical: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  addButton: {
    padding: THEME.SPACING.SM,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: THEME.SPACING.LG,
    paddingBottom: THEME.SPACING.MD,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.MD,
    height: 44,
  },
  searchIcon: {
    marginRight: THEME.SPACING.SM,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: THEME.COLORS.TEXT_PRIMARY,
    fontSize: THEME.FONT_SIZES.MD,
  },
  filterButton: {
    marginLeft: THEME.SPACING.MD,
    padding: THEME.SPACING.SM,
  },
  filtersContainer: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginHorizontal: THEME.SPACING.LG,
    marginBottom: THEME.SPACING.MD,
    padding: THEME.SPACING.MD,
  },
  filtersTitle: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: THEME.SPACING.MD,
  },
  filterChip: {
    backgroundColor: THEME.COLORS.BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.SM,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    marginRight: THEME.SPACING.SM,
    marginBottom: THEME.SPACING.SM,
  },
  activeFilterChip: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  activeFilterChipText: {
    color: 'white',
  },
  listContent: {
    padding: THEME.SPACING.LG,
    paddingTop: 0,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.SPACING.XL * 2,
  },
});

export default SubscriptionListScreen;