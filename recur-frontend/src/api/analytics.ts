import { apiClient } from './client';

export interface AnalyticsOverview {
  totalSpent: number;
  monthlyAverage: number;
  activeSubscriptions: number;
  savingsPotential: number;
  timeRange: string;
  displayCurrency: string;
}

export interface YearlyComparison {
  year: string;
  value: number;
  currency: string;
}

export interface TopSubscription {
  id: number;
  name: string;
  cost: number;
  originalCost: number;
  originalCurrency: string;
  categoryName: string;
  categoryColor: string;
  billingCycle: string;
  trend: string;
  currency: string;
}

export interface Insight {
  type: string;
  title: string;
  description: string;
  savings: number;
  action: string;
  currency: string;
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
  currency: string;
}

export interface CategorySpending {
  name: string;
  value: number;
  color: string;
  currency: string;
}

export const analyticsApi = {
  async getOverview(timeRange: string = '12months', displayCurrency?: string): Promise<AnalyticsOverview> {
    const params = new URLSearchParams({ timeRange });
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const response = await apiClient.get<AnalyticsOverview>(`/dashboard/analytics/overview?${params}`);
    return response.data;
  },

  async getExtendedMonthlySpending(timeRange: string = '12months', displayCurrency?: string): Promise<MonthlySpending[]> {
    const params = new URLSearchParams({ timeRange });
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const response = await apiClient.get<MonthlySpending[]>(`/dashboard/analytics/monthly-spending-extended?${params}`);
    return response.data;
  },

  async getYearlyComparison(displayCurrency?: string): Promise<YearlyComparison[]> {
    const params = new URLSearchParams();
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const url = params.toString() ? `/dashboard/analytics/yearly-comparison?${params}` : '/dashboard/analytics/yearly-comparison';
    const response = await apiClient.get<YearlyComparison[]>(url);
    return response.data;
  },

  async getTopSubscriptions(displayCurrency?: string): Promise<TopSubscription[]> {
    const params = new URLSearchParams();
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const url = params.toString() ? `/dashboard/analytics/top-subscriptions?${params}` : '/dashboard/analytics/top-subscriptions';
    const response = await apiClient.get<TopSubscription[]>(url);
    return response.data;
  },

  async getInsights(displayCurrency?: string): Promise<Insight[]> {
    const params = new URLSearchParams();
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const url = params.toString() ? `/dashboard/analytics/insights?${params}` : '/dashboard/analytics/insights';
    const response = await apiClient.get<Insight[]>(url);
    return response.data;
  },

  async getSpendingPatterns(displayCurrency?: string): Promise<SpendingPatterns> {
    const params = new URLSearchParams();
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const url = params.toString() ? `/dashboard/analytics/spending-patterns?${params}` : '/dashboard/analytics/spending-patterns';
    const response = await apiClient.get<SpendingPatterns>(url);
    return response.data;
  },

  async getCategorySpending(displayCurrency?: string): Promise<CategorySpending[]> {
    const params = new URLSearchParams();
    if (displayCurrency) params.append('displayCurrency', displayCurrency);
    const url = params.toString() ? `/dashboard/category-spending?${params}` : '/dashboard/category-spending';
    const response = await apiClient.get<CategorySpending[]>(url);
    return response.data;
  },
};