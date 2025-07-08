import { apiClient } from './client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  async getCategory(id: number): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<void> {
    await apiClient.put(`/categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  }
}; 