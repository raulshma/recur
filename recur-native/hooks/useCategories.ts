import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/api';
import { queryKeys, invalidateQueries } from '@/services/queryClient';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

// Hook for fetching all categories
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories don't change often)
  });
};

// Hook for fetching a single category
export const useCategory = (id: number) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryService.getCategory(id),
    enabled: !!id,
  });
};

// Hook for creating a category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoryService.createCategory(data),
    onSuccess: () => {
      invalidateQueries.categories();
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
    },
  });
};

// Hook for updating a category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
      categoryService.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      invalidateQueries.categories();
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
    },
  });
};

// Hook for deleting a category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: (_, id) => {
      invalidateQueries.categories();
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) });
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
    },
  });
};