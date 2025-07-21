import { api } from './client';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ApiResponse,
} from '@/types';

export interface CategoryService {
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category>;
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: number, data: UpdateCategoryDto): Promise<void>;
  deleteCategory(id: number): Promise<void>;
}

class CategoryServiceImpl implements CategoryService {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<void> {
    await api.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export const categoryService = new CategoryServiceImpl();