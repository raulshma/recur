import { 
  DashboardStats, 
  MonthlySpending, 
  CategorySpending, 
  UpcomingBill, 
  RecentActivity,
  Subscription,
  CurrencyBreakdown
} from '@/types';
import { 
  convertCurrency, 
  batchConvertCurrency, 
  calculateAnnualCost, 
  calculateMonthlyCost 
} from './currencyUtils';

/**
 * Transform dashboard stats with currency conversion
 * @param stats Original dashboard stats
 * @param targetCurrency Target currency for conversion
 * @returns Transformed dashboard stats with converted values
 */
export const transformDashboardStats = async (
  stats: DashboardStats,
  targetCurrency: string
): Promise<DashboardStats> => {
  // If stats are already in target currency, return as is
  if (stats.displayCurrency === targetCurrency) {
    return stats;
  }
  
  // Convert currency breakdowns
  const convertedBreakdowns: CurrencyBreakdown[] = [];
  
  for (const breakdown of stats.currencyBreakdowns) {
    // Skip if already in target currency
    if (breakdown.currency === targetCurrency) {
      convertedBreakdowns.push(breakdown);
      continue;
    }
    
    // Convert to target currency
    const result = await convertCurrency(
      breakdown.totalCost,
      breakdown.currency,
      targetCurrency
    );
    
    if (result) {
      convertedBreakdowns.push({
        ...breakdown,
        convertedCost: result.convertedAmount,
        exchangeRate: result.exchangeRate
      });
    } else {
      // If conversion fails, keep original values
      convertedBreakdowns.push(breakdown);
    }
  }
  
  // Calculate new totals based on converted values
  let totalMonthlyCost = 0;
  let totalAnnualCost = 0;
  
  convertedBreakdowns.forEach(breakdown => {
    totalMonthlyCost += breakdown.convertedCost || breakdown.totalCost;
  });
  
  totalAnnualCost = totalMonthlyCost * 12;
  
  return {
    ...stats,
    totalMonthlyCost,
    totalAnnualCost,
    displayCurrency: targetCurrency,
    currencyBreakdowns: convertedBreakdowns
  };
};

/**
 * Transform monthly spending data with currency conversion
 * @param spending Array of monthly spending data
 * @param targetCurrency Target currency for conversion
 * @returns Transformed monthly spending data with converted values
 */
export const transformMonthlySpending = async (
  spending: MonthlySpending[],
  targetCurrency: string
): Promise<MonthlySpending[]> => {
  // Prepare items for batch conversion
  const items = spending.map(item => ({
    ...item,
    amount: item.totalCost,
  }));
  
  // Perform batch conversion
  const convertedItems = await batchConvertCurrency(items, targetCurrency);
  
  // Transform back to MonthlySpending format
  return convertedItems.map(item => ({
    month: item.month,
    year: item.year,
    totalCost: item.convertedAmount,
    currency: targetCurrency
  }));
};

/**
 * Transform category spending data with currency conversion
 * @param spending Array of category spending data
 * @param targetCurrency Target currency for conversion
 * @returns Transformed category spending data with converted values
 */
export const transformCategorySpending = async (
  spending: CategorySpending[],
  targetCurrency: string
): Promise<CategorySpending[]> => {
  // Prepare items for batch conversion
  const items = spending.map(item => ({
    ...item,
    amount: item.totalCost,
  }));
  
  // Perform batch conversion
  const convertedItems = await batchConvertCurrency(items, targetCurrency);
  
  // Transform back to CategorySpending format
  return convertedItems.map(item => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryColor: item.categoryColor,
    totalCost: item.convertedAmount,
    subscriptionCount: item.subscriptionCount,
    currency: targetCurrency
  }));
};

/**
 * Transform upcoming bills data with currency conversion
 * @param bills Array of upcoming bill data
 * @param targetCurrency Target currency for conversion
 * @returns Transformed upcoming bills data with converted values
 */
export const transformUpcomingBills = async (
  bills: UpcomingBill[],
  targetCurrency: string
): Promise<UpcomingBill[]> => {
  // Prepare items for batch conversion
  const items = bills.map(item => ({
    ...item,
    amount: item.cost,
  }));
  
  // Perform batch conversion
  const convertedItems = await batchConvertCurrency(items, targetCurrency);
  
  // Transform back to UpcomingBill format
  return convertedItems.map(item => ({
    subscriptionId: item.subscriptionId,
    subscriptionName: item.subscriptionName,
    cost: item.convertedAmount,
    currency: targetCurrency,
    dueDate: item.dueDate,
    daysUntilDue: item.daysUntilDue,
    categoryColor: item.categoryColor
  }));
};

/**
 * Transform recent activity data with currency conversion
 * @param activities Array of recent activity data
 * @param targetCurrency Target currency for conversion
 * @returns Transformed recent activity data with converted values
 */
export const transformRecentActivity = async (
  activities: RecentActivity[],
  targetCurrency: string
): Promise<RecentActivity[]> => {
  // Filter activities that have cost and currency
  const activitiesWithCost = activities.filter(
    activity => activity.cost !== undefined && activity.currency !== undefined
  );
  
  const activitiesWithoutCost = activities.filter(
    activity => activity.cost === undefined || activity.currency === undefined
  );
  
  if (activitiesWithCost.length === 0) {
    return activities;
  }
  
  // Prepare items for batch conversion
  const items = activitiesWithCost.map(item => ({
    ...item,
    amount: item.cost!,
  }));
  
  // Perform batch conversion
  const convertedItems = await batchConvertCurrency(items, targetCurrency);
  
  // Transform back to RecentActivity format
  const convertedActivities = convertedItems.map(item => ({
    id: item.id,
    type: item.type,
    subscriptionName: item.subscriptionName,
    description: item.description,
    timestamp: item.timestamp,
    cost: item.convertedAmount,
    currency: targetCurrency
  }));
  
  // Combine with activities that don't have cost
  return [...convertedActivities, ...activitiesWithoutCost];
};

/**
 * Calculate subscription statistics
 * @param subscriptions Array of subscriptions
 * @param targetCurrency Target currency for conversion
 * @returns Dashboard statistics based on subscriptions
 */
export const calculateSubscriptionStats = async (
  subscriptions: Subscription[],
  targetCurrency: string
): Promise<{
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  upcomingBills: number;
  trialEnding: number;
  currencyBreakdowns: CurrencyBreakdown[];
}> => {
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive).length;
  
  // Group subscriptions by currency
  const currencyGroups: Record<string, Subscription[]> = {};
  
  subscriptions.forEach(sub => {
    if (!sub.isActive) return;
    
    if (!currencyGroups[sub.currency]) {
      currencyGroups[sub.currency] = [];
    }
    currencyGroups[sub.currency].push(sub);
  });
  
  // Calculate currency breakdowns
  const currencyBreakdowns: CurrencyBreakdown[] = [];
  let totalMonthlyCost = 0;
  
  for (const [currency, subs] of Object.entries(currencyGroups)) {
    // Calculate total cost in this currency
    const totalCost = subs.reduce((sum, sub) => {
      return sum + calculateMonthlyCost(sub.cost, sub.billingCycle);
    }, 0);
    
    // Convert to target currency if needed
    let convertedCost = totalCost;
    let exchangeRate = 1;
    
    if (currency !== targetCurrency) {
      const result = await convertCurrency(totalCost, currency, targetCurrency);
      if (result) {
        convertedCost = result.convertedAmount;
        exchangeRate = result.exchangeRate;
      }
    }
    
    currencyBreakdowns.push({
      currency,
      totalCost,
      subscriptionCount: subs.length,
      convertedCost,
      exchangeRate
    });
    
    totalMonthlyCost += convertedCost;
  }
  
  // Calculate annual cost
  const totalAnnualCost = totalMonthlyCost * 12;
  
  // Count upcoming bills (due in next 7 days)
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(now.getDate() + 7);
  
  const upcomingBills = subscriptions.filter(sub => {
    if (!sub.isActive) return false;
    const nextBilling = new Date(sub.nextBillingDate);
    return nextBilling >= now && nextBilling <= sevenDaysLater;
  }).length;
  
  // Count trials ending in next 7 days
  const trialEnding = subscriptions.filter(sub => {
    if (!sub.isActive || !sub.isTrial || !sub.trialEndDate) return false;
    const trialEnd = new Date(sub.trialEndDate);
    return trialEnd >= now && trialEnd <= sevenDaysLater;
  }).length;
  
  return {
    totalSubscriptions,
    activeSubscriptions,
    totalMonthlyCost,
    totalAnnualCost,
    upcomingBills,
    trialEnding,
    currencyBreakdowns
  };
};

/**
 * Generate trend indicators for dashboard metrics
 * @param currentValue Current metric value
 * @param previousValue Previous metric value
 * @returns Trend information
 */
export const calculateTrend = (
  currentValue: number,
  previousValue: number
): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
  if (previousValue === 0) {
    return { direction: 'stable', percentage: 0 };
  }
  
  const difference = currentValue - previousValue;
  const percentage = Math.abs((difference / previousValue) * 100);
  
  if (Math.abs(percentage) < 0.5) {
    return { direction: 'stable', percentage: 0 };
  }
  
  return {
    direction: difference > 0 ? 'up' : 'down',
    percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
  };
};

/**
 * Format date range for analytics
 * @param startDate Start date
 * @param endDate End date
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
  };
  
  const start = startDate.toLocaleDateString(undefined, options);
  const end = endDate.toLocaleDateString(undefined, options);
  
  return `${start} - ${end}`;
};