import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/config';
import { UpcomingBill } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { router } from 'expo-router';

interface UpcomingBillsListProps {
  data: UpcomingBill[] | null;
  currency: string;
  isLoading: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

export const UpcomingBillsList: React.FC<UpcomingBillsListProps> = ({
  data,
  currency: _currency,
  isLoading,
  maxItems = 5,
  showViewAll = true,
}) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Navigate to subscription details
  const navigateToSubscription = (subscriptionId: number) => {
    // Use router.push with type assertion for dynamic routes
    router.push(`/modals/subscription-details?id=${subscriptionId}` as any);
  };
  
  // Navigate to all subscriptions
  const navigateToAllSubscriptions = () => {
    router.push('/(tabs)/subscriptions');
  };
  
  // Limit the number of items to display
  const displayData = data ? data.slice(0, maxItems) : [];
  const hasMoreItems = data && data.length > maxItems;
  
  // If loading and no data, show loading spinner
  if (isLoading && !data?.length) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="small" />
      </View>
    );
  }
  
  // If no data, show empty state
  if (!data?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Bills</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No upcoming bills in the next 30 days</Text>
        </View>
      </View>
    );
  }
  
  // Render each bill item
  const renderBillItem = ({ item }: { item: UpcomingBill }) => (
    <TouchableOpacity
      style={styles.billItem}
      onPress={() => navigateToSubscription(item.subscriptionId)}
    >
      <View style={styles.billInfo}>
        <View style={[styles.categoryIndicator, { backgroundColor: item.categoryColor }]} />
        <View style={styles.billDetails}>
          <Text style={styles.billName} numberOfLines={1}>
            {item.subscriptionName}
          </Text>
          <Text style={styles.billDate}>
            Due {formatDate(item.dueDate)}
            {item.daysUntilDue === 0 ? ' (Today)' : 
             item.daysUntilDue === 1 ? ' (Tomorrow)' : 
             ` (in ${item.daysUntilDue} days)`}
          </Text>
        </View>
      </View>
      <Text style={styles.billAmount}>
        {formatCurrency(item.cost, item.currency)}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Bills</Text>
        <Text style={styles.subtitle}>Next 30 days</Text>
      </View>
      
      <FlatList
        data={displayData}
        renderItem={renderBillItem}
        keyExtractor={(item) => `bill-${item.subscriptionId}`}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming bills</Text>
          </View>
        }
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </View>
      )}
      
      {showViewAll && hasMoreItems && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={navigateToAllSubscriptions}
        >
          <Text style={styles.viewAllText}>
            View All ({data?.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    shadowColor: THEME.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  listContent: {
    flexGrow: 1,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: `${THEME.COLORS.BORDER}50`,
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: THEME.SPACING.SM,
  },
  billDetails: {
    flex: 1,
  },
  billName: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  billDate: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  billAmount: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SPACING.SM,
  },
  loadingContainer: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${THEME.COLORS.BACKGROUND}80`,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.BORDER_RADIUS.LG,
  },
  emptyContainer: {
    padding: THEME.SPACING.LG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.XS,
    paddingHorizontal: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    backgroundColor: `${THEME.COLORS.PRIMARY}10`,
  },
  viewAllText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
  },
});