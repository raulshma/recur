import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/config';
import { RecentActivity } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface RecentActivityListProps {
  data: RecentActivity[] | null;
  currency: string;
  isLoading: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  data,
  currency: _currency,
  isLoading,
  maxItems = 5,
  showViewAll = true,
}) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    const activityDate = new Date(date);
    const now = new Date();
    
    // If today, show time
    if (activityDate.toDateString() === now.toDateString()) {
      return `Today, ${activityDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (activityDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return activityDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return { name: 'add-circle', color: THEME.COLORS.SUCCESS };
      case 'updated':
        return { name: 'create', color: THEME.COLORS.PRIMARY };
      case 'cancelled':
        return { name: 'close-circle', color: THEME.COLORS.ERROR };
      case 'reactivated':
        return { name: 'refresh-circle', color: THEME.COLORS.SUCCESS };
      default:
        return { name: 'ellipsis-horizontal-circle', color: THEME.COLORS.TEXT_SECONDARY };
    }
  };
  
  // Navigate to subscription details
  const navigateToSubscription = (_subscriptionName: string) => {
    // In a real app, we would navigate to the specific subscription
    // For now, just navigate to the subscriptions tab
    router.push('/(tabs)/subscriptions');
  };
  
  // Navigate to all activity
  const navigateToAllActivity = () => {
    // In a real app, we would navigate to a dedicated activity screen
    // For now, just navigate to the subscriptions tab
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
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    );
  }
  
  // Render each activity item
  const renderActivityItem = ({ item }: { item: RecentActivity }) => {
    const icon = getActivityIcon(item.type);
    
    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => navigateToSubscription(item.subscriptionName)}
      >
        <View style={styles.activityIconContainer}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={styles.activityDetails}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityName} numberOfLines={1}>
              {item.subscriptionName}
            </Text>
            <Text style={styles.activityDate}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description}
          </Text>
          {item.cost && item.currency && (
            <Text style={styles.activityCost}>
              {formatCurrency(item.cost, item.currency)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
      </View>
      
      <FlatList
        data={displayData}
        renderItem={renderActivityItem}
        keyExtractor={(item) => `activity-${item.id}`}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent activity</Text>
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
          onPress={navigateToAllActivity}
        >
          <Text style={styles.viewAllText}>
            View All Activity ({data?.length})
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
  listContent: {
    flexGrow: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: THEME.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: `${THEME.COLORS.BORDER}50`,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${THEME.COLORS.BACKGROUND}50`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.SM,
  },
  activityDetails: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityName: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  activityDate: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginLeft: THEME.SPACING.SM,
  },
  activityDescription: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  activityCost: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
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