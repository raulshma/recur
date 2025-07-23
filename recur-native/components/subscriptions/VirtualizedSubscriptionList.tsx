import React, { useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Subscription } from '@/types';
import { SubscriptionCard, EmptyState } from '@/components/common';
import { THEME } from '@/constants/config';

interface VirtualizedSubscriptionListProps {
  subscriptions: Subscription[] | undefined;
  isLoading: boolean;
  onSelectSubscription: (subscription: Subscription) => void;
  onEditSubscription?: (subscription: Subscription) => void;
  onCancelSubscription?: (subscription: Subscription) => void;
  onDeleteSubscription?: (subscription: Subscription) => void;
  onReactivateSubscription?: (subscription: Subscription) => void;
  onAddSubscription: () => void;
  searchQuery?: string;
  hasFilters?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const VirtualizedSubscriptionList: React.FC<VirtualizedSubscriptionListProps> = ({
  subscriptions,
  isLoading,
  onSelectSubscription,
  onEditSubscription,
  onCancelSubscription,
  onDeleteSubscription,
  onReactivateSubscription,
  onAddSubscription,
  searchQuery,
  hasFilters,
  refreshing = false,
  onRefresh,
}) => {
  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
        </View>
      );
    }

    return (
      <EmptyState
        title="No subscriptions found"
        message={
          searchQuery || hasFilters
            ? "Try adjusting your filters or search query"
            : "Add your first subscription to get started"
        }
        actionLabel="Add Subscription"
        onAction={onAddSubscription}
      />
    );
  }, [isLoading, searchQuery, hasFilters, onAddSubscription]);

  // Render subscription item
  const renderItem = useCallback(({ item }: { item: Subscription }) => {
    return (
      <SubscriptionCard
        subscription={item}
        onPress={onSelectSubscription}
        onEdit={onEditSubscription}
        onCancel={onCancelSubscription}
        onDelete={onDeleteSubscription}
        onReactivate={onReactivateSubscription}
      />
    );
  }, [
    onSelectSubscription,
    onEditSubscription,
    onCancelSubscription,
    onDeleteSubscription,
    onReactivateSubscription,
  ]);

  // Extract key for FlashList
  const keyExtractor = useCallback((item: Subscription) => item.id.toString(), []);

  return (
    <FlashList
      data={subscriptions || []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={120}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyState}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
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

export default VirtualizedSubscriptionList;