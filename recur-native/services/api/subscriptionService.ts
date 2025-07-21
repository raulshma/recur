import { api } from './client';
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionFilters,
  SubscriptionHistory,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export interface SubscriptionService {
  getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription>;
  createSubscription(data: CreateSubscriptionDto): Promise<Subscription>;
  updateSubscription(id: number, data: UpdateSubscriptionDto): Promise<void>;
  deleteSubscription(id: number): Promise<void>;
  cancelSubscription(id: number): Promise<void>;
  reactivateSubscription(id: number): Promise<void>;
  getSubscriptionHistory(id: number): Promise<SubscriptionHistory[]>;
}

class SubscriptionServiceImpl implements SubscriptionService {
  async getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.isTrial !== undefined) params.append('isTrial', filters.isTrial.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const response = await api.get<ApiResponse<Subscription[]>>(
      `/subscriptions${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  }

  async getSubscription(id: number): Promise<Subscription> {
    const response = await api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
    return response.data;
  }

  async createSubscription(data: CreateSubscriptionDto): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>('/subscriptions', data);
    return response.data;
  }

  async updateSubscription(id: number, data: UpdateSubscriptionDto): Promise<void> {
    await api.put(`/subscriptions/${id}`, data);
  }

  async deleteSubscription(id: number): Promise<void> {
    await api.delete(`/subscriptions/${id}`);
  }

  async cancelSubscription(id: number): Promise<void> {
    await api.post(`/subscriptions/${id}/cancel`);
  }

  async reactivateSubscription(id: number): Promise<void> {
    await api.post(`/subscriptions/${id}/reactivate`);
  }

  async getSubscriptionHistory(id: number): Promise<SubscriptionHistory[]> {
    const response = await api.get<ApiResponse<SubscriptionHistory[]>>(`/subscriptions/${id}/history`);
    return response.data;
  }
}

export const subscriptionService = new SubscriptionServiceImpl();