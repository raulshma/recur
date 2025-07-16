import { apiClient } from './client';

export interface AnalyticsOverview {
  totalSpent: number;
  monthlyAverage: number;
  activeSubscriptions: number;
  savingsPotential: number;
  timeRange: string;
}

export interface YearlyComparison {
  year: string;
  value: number;
}

export interface TopSubscription {
  id: number;
  name: string;
  cost: number;
  categoryName: string;
  categoryColor: string;
  billingCycle: string;
  trend: string;
}

export interface Insight {
  type: string;
  title: string;
  description: string;
  savings: number;
  action: string;
}

export interface SpendingPatterns {
  mostActiveDay: number;
  averageServiceLifeMonths: number;
  cancellationRate: number;
  peakSpendingMonth: string;
}

export interface MonthlySpending {
  name: string;
  value: number;
}

export interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

export const analyticsApi = {
  async getOverview(timeRange: string = '12months'): Promise<AnalyticsOverview> {
    const response = await apiClient.get<AnalyticsOverview>(`/dashboard/analytics/overview?timeRange=${timeRange}`);
    return response.data;
  },

  async getExtendedMonthlySpending(timeRange: string = '12months'): Promise<MonthlySpending[]> {
    const response = await apiClient.get<MonthlySpending[]>(`/dashboard/analytics/monthly-spending-extended?timeRange=${timeRange}`);
    return response.data;
  },

  async getYearlyComparison(): Promise<YearlyComparison[]> {
    const response = await apiClient.get<YearlyComparison[]>('/dashboard/analytics/yearly-comparison');
    return response.data;
  },

  async getTopSubscriptions(): Promise<TopSubscription[]> {
    const response = await apiClient.get<TopSubscription[]>('/dashboard/analytics/top-subscriptions');
    return response.data;
  },

  async getInsights(): Promise<Insight[]> {
    const response = await apiClient.get<Insight[]>('/dashboard/analytics/insights');
    return response.data;
  },

  async getSpendingPatterns(): Promise<SpendingPatterns> {
    const response = await apiClient.get<SpendingPatterns>('/dashboard/analytics/spending-patterns');
    return response.data;
  },

  async getCategorySpending(): Promise<CategorySpending[]> {
    const response = await apiClient.get<CategorySpending[]>('/dashboard/category-spending');
    return response.data;
  },
};