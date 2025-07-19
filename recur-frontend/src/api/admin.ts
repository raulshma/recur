import { apiClient } from './client';
import type { 
  AdminStats, 
  AdminUser, 
  Invite, 
  CreateInviteRequest, 
  UpdateUserRoleRequest 
} from '../types';

export const adminApi = {
  // Dashboard stats
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
  },

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<AdminUser[]> {
    const response = await apiClient.get<AdminUser[]>('/admin/users', { params });
    return response.data;
  },

  async updateUserRole(data: UpdateUserRoleRequest): Promise<void> {
    await apiClient.put(`/admin/users/${data.userId}/role`, { role: data.role });
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  // Invite management
  async createInvite(data: CreateInviteRequest): Promise<Invite> {
    const response = await apiClient.post<Invite>('/admin/invites', data);
    return response.data;
  },

  async getInvites(params?: {
    page?: number;
    limit?: number;
    includeUsed?: boolean;
  }): Promise<Invite[]> {
    const response = await apiClient.get<Invite[]>('/admin/invites', { params });
    return response.data;
  },

  async deleteInvite(inviteId: number): Promise<void> {
    await apiClient.delete(`/admin/invites/${inviteId}`);
  },

  async resendInvite(inviteId: number): Promise<Invite> {
    const response = await apiClient.post<Invite>(`/admin/invites/${inviteId}/resend`);
    return response.data;
  }
}; 