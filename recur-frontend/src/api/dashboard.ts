import { apiClient } from './client';

export interface DashboardStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  upcomingBills: number;
  trialEnding: number;
  daysUntilNextBilling: number;
  
  // Currency-aware properties
  displayCurrency: string;
  currencyBreakdowns: CurrencyBreakdown[];
}

export interface CurrencyBreakdown {
  currency: string;
  originalAmount: number;
  convertedAmount: number;
  subscriptionCount: number;
}

export interface Notification {
  id: string;
  type: 'renewal' | 'trial' | 'budget' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
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

export interface UpcomingBill {
  id: number;
  name: string;
  amount: number;
  currency: string;
  date: string;
  categoryName: string;
  categoryColor: string;
  
  // Currency conversion properties
  convertedAmount?: number;
  convertedCurrency?: string;
  isConverted: boolean;
}

export interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  categoryColor: string;
  
  // Cost information for currency display
  cost: number;
  currency: string;
  billingCycle: string;
  
  // Currency conversion properties
  convertedCost?: number;
  convertedCurrency?: string;
  isConverted: boolean;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/dashboard/notifications');
    return response.data;
  },

  async getMonthlySpending(): Promise<MonthlySpending[]> {
    const response = await apiClient.get<MonthlySpending[]>('/dashboard/monthly-spending');
    return response.data;
  },

  async getCategorySpending(): Promise<CategorySpending[]> {
    const response = await apiClient.get<CategorySpending[]>('/dashboard/category-spending');
    return response.data;
  },

  async getUpcomingBills(): Promise<UpcomingBill[]> {
    const response = await apiClient.get<UpcomingBill[]>('/dashboard/upcoming-bills');
    return response.data;
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/recent-activity');
    return response.data;
  },
};