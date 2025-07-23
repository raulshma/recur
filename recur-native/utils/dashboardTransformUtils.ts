import {
  MonthlySpending,
  CategorySpending,
  UpcomingBill,
  RecentActivity,
  Subscription,
} from "@/types";
import { batchConvertCurrency } from "./currencyUtils";

/**
 * Calculate trend percentage between current and previous values
 * @param current Current value
 * @param previous Previous value
 * @returns Trend object with direction and percentage
 */
export const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return { direction: "stable" as const, percentage: 0 };
  }

  const difference = current - previous;
  const percentage = Math.round((Math.abs(difference) / previous) * 100);

  if (difference > 0) {
    return { direction: "up" as const, percentage };
  } else if (difference < 0) {
    return { direction: "down" as const, percentage };
  } else {
    return { direction: "stable" as const, percentage: 0 };
  }
};

/**
 * Transform monthly spending data to target currency
 * @param data Original monthly spending data
 * @param targetCurrency Target currency code
 * @returns Transformed monthly spending data
 */
export const transformMonthlySpending = async (
  data: MonthlySpending[],
  targetCurrency: string
): Promise<MonthlySpending[]> => {
  if (!data || data.length === 0) {
    return [];
  }

  // Skip conversion if all items are already in target currency
  const needsConversion = data.some((item) => item.currency !== targetCurrency);
  if (!needsConversion) {
    return data;
  }

  // Prepare items for batch conversion
  const items = data.map((item) => ({
    month: item.month,
    year: item.year,
    amount: item.totalCost,
    currency: item.currency,
  }));

  // Perform batch conversion with type assertion
  const convertedItems = await batchConvertCurrency(
    items as { amount: number; currency: string }[],
    targetCurrency
  );

  // Transform back to MonthlySpending format
  return convertedItems.map((item, index) => ({
    month: items[index]?.month || "",
    year: items[index]?.year || 0,
    totalCost: item.convertedAmount,
    currency: targetCurrency,
  }));
};

/**
 * Transform category spending data to target currency
 * @param data Original category spending data
 * @param targetCurrency Target currency code
 * @returns Transformed category spending data
 */
export const transformCategorySpending = async (
  data: CategorySpending[],
  targetCurrency: string
): Promise<CategorySpending[]> => {
  if (!data || data.length === 0) {
    return [];
  }

  // Skip conversion if all items are already in target currency
  const needsConversion = data.some((item) => item.currency !== targetCurrency);
  if (!needsConversion) {
    return data;
  }

  // Prepare items for batch conversion
  const items = data.map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryColor: item.categoryColor,
    subscriptionCount: item.subscriptionCount,
    amount: item.totalCost,
    currency: item.currency,
  }));

  // Perform batch conversion with type assertion
  const convertedItems = await batchConvertCurrency(
    items as { amount: number; currency: string }[],
    targetCurrency
  );

  // Transform back to CategorySpending format
  return convertedItems.map((item, index) => ({
    categoryId: items[index]?.categoryId || 0,
    categoryName: items[index]?.categoryName || "",
    categoryColor: items[index]?.categoryColor || "#000000",
    totalCost: item.convertedAmount,
    subscriptionCount: items[index]?.subscriptionCount || 0,
    currency: targetCurrency,
  }));
};

/**
 * Transform upcoming bills data to target currency
 * @param data Original upcoming bills data
 * @param targetCurrency Target currency code
 * @returns Transformed upcoming bills data
 */
export const transformUpcomingBills = async (
  data: UpcomingBill[],
  targetCurrency: string
): Promise<UpcomingBill[]> => {
  if (!data || data.length === 0) {
    return [];
  }

  // Skip conversion if all items are already in target currency
  const needsConversion = data.some((item) => item.currency !== targetCurrency);
  if (!needsConversion) {
    return data;
  }

  // Prepare items for batch conversion
  const items = data.map((item) => ({
    subscriptionId: item.subscriptionId,
    subscriptionName: item.subscriptionName,
    dueDate: item.dueDate,
    daysUntilDue: item.daysUntilDue,
    categoryColor: item.categoryColor,
    amount: item.cost,
    currency: item.currency,
  }));

  // Perform batch conversion with type assertion
  const convertedItems = await batchConvertCurrency(
    items as { amount: number; currency: string }[],
    targetCurrency
  );

  // Transform back to UpcomingBill format
  return convertedItems.map((item, index) => ({
    subscriptionId: items[index]?.subscriptionId || 0,
    subscriptionName: items[index]?.subscriptionName || "",
    cost: item.convertedAmount,
    currency: targetCurrency,
    dueDate: items[index]?.dueDate || new Date(),
    daysUntilDue: items[index]?.daysUntilDue || 0,
    categoryColor: items[index]?.categoryColor || "#000000",
  }));
};

/**
 * Transform recent activity data to target currency
 * @param data Original recent activity data
 * @param targetCurrency Target currency code
 * @returns Transformed recent activity data
 */
export const transformRecentActivity = async (
  data: RecentActivity[],
  targetCurrency: string
): Promise<RecentActivity[]> => {
  if (!data || data.length === 0) {
    return [];
  }

  // Separate activities with and without cost
  const activitiesWithCost = data.filter(
    (item) => item.cost !== undefined && item.currency !== undefined
  );
  const activitiesWithoutCost = data.filter(
    (item) => item.cost === undefined || item.currency === undefined
  );

  // Skip conversion if no items with cost
  if (activitiesWithCost.length === 0) {
    return data;
  }

  // Prepare items for batch conversion
  const items = activitiesWithCost.map((item) => ({
    id: item.id,
    type: item.type,
    subscriptionName: item.subscriptionName,
    description: item.description,
    timestamp: item.timestamp,
    amount: item.cost!,
    currency: item.currency!,
  }));

  // Perform batch conversion with type assertion
  const convertedItems = await batchConvertCurrency(
    items as { amount: number; currency: string }[],
    targetCurrency
  );

  // Transform back to RecentActivity format with proper typing
  const convertedActivities = convertedItems.map((item, index) => ({
    id: items[index]?.id || 0,
    type: items[index]?.type || "created",
    subscriptionName: items[index]?.subscriptionName || "",
    description: items[index]?.description || "",
    timestamp: items[index]?.timestamp || new Date(),
    cost: item.convertedAmount,
    currency: targetCurrency,
  }));

  return [...convertedActivities, ...activitiesWithoutCost];
};

/**
 * Group subscriptions by currency
 * @param subscriptions List of subscriptions
 * @returns Map of currency to subscriptions
 */
export const groupSubscriptionsByCurrency = (
  subscriptions: Subscription[]
): Record<string, Subscription[]> => {
  const currencyGroups: Record<string, Subscription[]> = {};

  subscriptions.forEach((sub) => {
    if (!sub.isActive || !sub.currency) return;

    if (!currencyGroups[sub.currency]) {
      currencyGroups[sub.currency] = [];
    }

    // Use optional chaining to safely access and update
    currencyGroups[sub.currency]?.push(sub);
  });

  return currencyGroups;
};
