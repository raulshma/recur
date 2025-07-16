import { apiClient } from './client';

export interface DashboardStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  upcomingBills: number;
  trialEnding: number;
  daysUntilNextBilling: number;
}

export interface Notification {
  id: string;
  type: 'renewal' | 'trial' | 'budget' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
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
};