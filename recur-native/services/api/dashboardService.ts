import { api } from './client';
import {
  DashboardStats,
  Notification,
  MonthlySpending,
  CategorySpending,
  UpcomingBill,
  RecentActivity,
  AnalyticsOverview,
  ApiResponse,
} from '@/types';

export interface DashboardService {
  getDashboardStats(currency?: string): Promise<DashboardStats>;
  getNotifications(): Promise<Notification[]>;
  getMonthlySpending(currency?: string): Promise<MonthlySpending[]>;
  getCategorySpending(currency?: string): Promise<CategorySpending[]>;
  getUpcomingBills(currency?: string): Promise<UpcomingBill[]>;
  getRecentActivity(currency?: string): Promise<RecentActivity[]>;
  getAnalyticsOverview(timeRange: string, currency?: string): Promise<AnalyticsOverview>;
}

class DashboardServiceImpl implements DashboardService {
  async getDashboardStats(currency?: string): Promise<DashboardStats> {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get<ApiResponse<DashboardStats>>(`/dashboard/stats${params}`);
    return response.data;
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications');
    return response.data;
  }

  async getMonthlySpending(currency?: string): Promise<MonthlySpending[]> {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get<ApiResponse<MonthlySpending[]>>(`/dashboard/monthly-spending${params}`);
    return response.data;
  }

  async getCategorySpending(currency?: string): Promise<CategorySpending[]> {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get<ApiResponse<CategorySpending[]>>(`/dashboard/category-spending${params}`);
    return response.data;
  }

  async getUpcomingBills(currency?: string): Promise<UpcomingBill[]> {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get<ApiResponse<UpcomingBill[]>>(`/dashboard/upcoming-bills${params}`);
    return response.data;
  }

  async getRecentActivity(currency?: string): Promise<RecentActivity[]> {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get<ApiResponse<RecentActivity[]>>(`/dashboard/recent-activity${params}`);
    return response.data;
  }

  async getAnalyticsOverview(timeRange: string, currency?: string): Promise<AnalyticsOverview> {
    const params = new URLSearchParams({ timeRange });
    if (currency) params.append('currency', currency);
    
    const response = await api.get<ApiResponse<AnalyticsOverview>>(
      `/analytics/overview?${params.toString()}`
    );
    return response.data;
  }
}

export const dashboardService = new DashboardServiceImpl();