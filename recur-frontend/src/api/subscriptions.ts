import { apiClient } from './client';
import type { 
  Subscription, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest, 
  SubscriptionFilters 
} from '../types';

export const subscriptionsApi = {
  async getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>('/subscriptions', filters);
    return response.data;
  },

  async getSubscription(id: number): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
  },

  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    const response = await apiClient.post<Subscription>('/subscriptions', data);
    return response.data;
  },

  async updateSubscription(id: number, data: UpdateSubscriptionRequest): Promise<void> {
    await apiClient.put(`/subscriptions/${id}`, data);
  },

  async deleteSubscription(id: number): Promise<void> {
    await apiClient.delete(`/subscriptions/${id}`);
  },

  async cancelSubscription(id: number): Promise<void> {
    await apiClient.post(`/subscriptions/${id}/cancel`);
  },

  async reactivateSubscription(id: number): Promise<void> {
    await apiClient.post(`/subscriptions/${id}/reactivate`);
  }
}; 