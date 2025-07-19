import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User, CreateInviteRequestByUser } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/change-password', data);
    return response.data;
  },

  async requestInvite(data: CreateInviteRequestByUser): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/request-invite', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  storeAuthData(token: string, user: User) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}; 