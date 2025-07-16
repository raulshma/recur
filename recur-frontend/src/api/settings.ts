import { apiClient } from './client';

export interface UserSettings {
  emailNotifications: boolean;
  trialEndingAlerts: boolean;
  billingReminders: boolean;
  priceChangeAlerts: boolean;
  recommendationAlerts: boolean;
  trialEndingReminderDays: number;
  billingReminderDays: number;
  defaultCurrency: string;
  dateFormat: string;
  timeZone: string;
  theme: string;
  dashboardLayout?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  timeZone?: string;
  currency: string;
  budgetLimit?: number;
}

export interface UpdateUserSettingsRequest {
  emailNotifications: boolean;
  trialEndingAlerts: boolean;
  billingReminders: boolean;
  priceChangeAlerts: boolean;
  recommendationAlerts: boolean;
  trialEndingReminderDays: number;
  billingReminderDays: number;
  defaultCurrency: string;
  dateFormat: string;
  timeZone: string;
  theme: string;
  dashboardLayout?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
}

export const settingsApi = {
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    const response = await apiClient.put<AuthResponse>('/auth/profile', data);
    return response.data;
  },

  async getUserSettings(): Promise<UserSettings> {
    const response = await apiClient.get<UserSettings>('/auth/settings');
    return response.data;
  },

  async updateUserSettings(data: UpdateUserSettingsRequest): Promise<AuthResponse> {
    const response = await apiClient.put<AuthResponse>('/auth/settings', data);
    return response.data;
  },

  async deleteAccount(): Promise<AuthResponse> {
    const response = await apiClient.delete<AuthResponse>('/auth/account');
    return response.data;
  },

  async exportData(): Promise<Blob> {
    const response = await apiClient.get('/auth/export-data', {}, {
      responseType: 'blob'
    });
    return response.data;
  },
};