import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { THEME } from '@/constants/config';
import { 
  useDashboardStats, 
  useNotifications, 
  useMonthlySpending,
  useCategorySpending,
  useUpcomingBills,
  useRecentActivity
} from '@/hooks/useDashboard';
import { useRefreshDashboard } from '@/hooks/useDashboard';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { StatsCard } from '@/components/dashboard';
import { CurrencyBreakdown } from '@/components/dashboard';
import { QuickActionButton, QuickActionGroup } from '@/components/dashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { calculateTrend } from '@/utils/dashboardTransformUtils';
import { router } from 'expo-router';
import { 
  MonthlySpendingChart, 
  CategorySpendingChart,
  UpcomingBillsList,
  RecentActivityList
} from '@/components/charts';

export default function DashboardScreen() {
  const { currency } = useAppSettingsStore();
  const { isOnline } = useOfflineSync();
  
  // Get dashboard data
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError,
  } = useDashboardStats(currency);
  
  // Get notifications
  const { 
    data: notifications,
    isLoading: isLoadingNotifications,
  } = useNotifications();
  
  // Get monthly spending data
  const {
    data: monthlySpending,
    isLoading: isLoadingMonthlySpending,
  } = useMonthlySpending(currency);
  
  // Get category spending data
  const {
    data: categorySpending,
    isLoading: isLoadingCategorySpending,
  } = useCategorySpending(currency);
  
  // Get upcoming bills
  const {
    data: upcomingBills,
    isLoading: isLoadingUpcomingBills,
  } = useUpcomingBills(currency);
  
  // Get recent activity
  const {
    data: recentActivity,
    isLoading: isLoadingRecentActivity,
  } = useRecentActivity(currency);
  
  // Refresh functionality
  const { refreshAll, isRefreshing } = useRefreshDashboard(currency);
  
  // Handle refresh
  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);
  
  // Calculate trends (mock data for now, would be replaced with actual historical data)
  const [mockPreviousMonthly] = useState(stats?.totalMonthlyCost ? stats.totalMonthlyCost * 0.95 : 0);
  const [mockPreviousActive] = useState(stats?.activeSubscriptions ? stats.activeSubscriptions - 1 : 0);
  
  const monthlyCostTrend = stats?.totalMonthlyCost 
    ? calculateTrend(stats.totalMonthlyCost, mockPreviousMonthly)
    : { direction: 'stable' as const, percentage: 0 };
  
  const activeSubsTrend = stats?.activeSubscriptions 
    ? calculateTrend(stats.activeSubscriptions, mockPreviousActive)
    : { direction: 'stable' as const, percentage: 0 };
  
  // Handle navigation
  const navigateToAddSubscription = () => {
    router.push('/modals/add-subscription');
  };
  
  const navigateToSubscriptions = () => {
    router.push('/(tabs)/subscriptions');
  };
  
  const navigateToCategories = () => {
    router.push('/(tabs)/categories');
  };
  
  // Handle month selection in chart
  const handleMonthSelection = (month: string, year: number) => {
    // In a real app, this would navigate to a detailed view for the selected month
    console.log(`Selected month: ${month} ${year}`);
  };
  
  // Handle category selection in chart
  const handleCategorySelection = (categoryId: number) => {
    // In a real app, this would navigate to a detailed view for the selected category
    if (categoryId === -1) {
      // View all categories
      navigateToCategories();
    } else {
      console.log(`Selected category ID: ${categoryId}`);
    }
  };
  
  // If initial loading, show loading spinner
  if (isLoadingStats && !stats) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner message="Loading dashboard..." />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[THEME.COLORS.PRIMARY]}
            tintColor={THEME.COLORS.PRIMARY}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
        
        {/* Quick Actions */}
        <QuickActionGroup>
          <QuickActionButton
            title="Add Subscription"
            icon="+"
            onPress={navigateToAddSubscription}
            variant="primary"
          />
          <QuickActionButton
            title="View All"
            onPress={navigateToSubscriptions}
            variant="outline"
          />
          <QuickActionButton
            title="Categories"
            onPress={navigateToCategories}
            variant="outline"
          />
        </QuickActionGroup>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="Monthly Cost"
            value={stats?.totalMonthlyCost || 0}
            currency={currency}
            isCurrency={true}
            trend={monthlyCostTrend}
            isLoading={isLoadingStats}
            style={styles.statsCard}
            onPress={navigateToSubscriptions}
          />
          
          <StatsCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            subtitle={`of ${stats?.totalSubscriptions || 0} total`}
            trend={activeSubsTrend}
            isLoading={isLoadingStats}
            style={styles.statsCard}
            onPress={navigateToSubscriptions}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <StatsCard
            title="Upcoming Bills"
            value={stats?.upcomingBills || 0}
            subtitle="in the next 7 days"
            isLoading={isLoadingStats}
            style={styles.statsCard}
          />
          
          <StatsCard
            title="Trials Ending"
            value={stats?.trialEnding || 0}
            subtitle="in the next 7 days"
            isLoading={isLoadingStats}
            style={styles.statsCard}
          />
        </View>
        
        {/* Currency Breakdown */}
        {stats?.currencyBreakdowns && stats.currencyBreakdowns.length > 1 && (
          <CurrencyBreakdown
            breakdowns={stats.currencyBreakdowns}
            displayCurrency={currency}
            isLoading={isLoadingStats}
          />
        )}
        
        {/* Monthly Spending Chart */}
        <MonthlySpendingChart
          data={monthlySpending}
          currency={currency}
          isLoading={isLoadingMonthlySpending}
          onSelectMonth={handleMonthSelection}
        />
        
        {/* Category Spending Chart */}
        <CategorySpendingChart
          data={categorySpending}
          currency={currency}
          isLoading={isLoadingCategorySpending}
          onSelectCategory={handleCategorySelection}
        />
        
        {/* Upcoming Bills List */}
        <UpcomingBillsList
          data={upcomingBills}
          currency={currency}
          isLoading={isLoadingUpcomingBills}
          maxItems={3}
          showViewAll={true}
        />
        
        {/* Recent Activity List */}
        <RecentActivityList
          data={recentActivity}
          currency={currency}
          isLoading={isLoadingRecentActivity}
          maxItems={3}
          showViewAll={true}
        />
        
        {/* Error State */}
        {statsError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load dashboard data. Please try again.
            </Text>
            <QuickActionButton
              title="Retry"
              onPress={onRefresh}
              variant="primary"
              style={styles.retryButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  offlineBadge: {
    backgroundColor: THEME.COLORS.WARNING,
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS,
    borderRadius: THEME.BORDER_RADIUS.MD,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.SM,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: THEME.SPACING.XS,
  },
  errorContainer: {
    padding: THEME.SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${THEME.COLORS.ERROR}10`,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginVertical: THEME.SPACING.MD,
  },
  errorText: {
    color: THEME.COLORS.ERROR,
    textAlign: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  retryButton: {
    minWidth: 120,
  },
});