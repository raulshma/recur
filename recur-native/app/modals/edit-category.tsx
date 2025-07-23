import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/config';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategory } from '@/hooks/useCategories';
import { EmptyState } from '@/components/common/EmptyState';

export default function EditCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = id ? parseInt(id, 10) : 0;
  
  const { data: category, isLoading, isError, refetch } = useCategory(categoryId);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Edit Category',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: THEME.COLORS.BACKGROUND,
            },
            headerTitleStyle: {
              color: THEME.COLORS.TEXT_PRIMARY,
            },
            presentation: 'modal',
          }}
        />
        <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
      </View>
    );
  }

  if (isError || !category) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Edit Category',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: THEME.COLORS.BACKGROUND,
            },
            headerTitleStyle: {
              color: THEME.COLORS.TEXT_PRIMARY,
            },
            presentation: 'modal',
          }}
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Category"
          message="There was a problem loading the category. Please try again."
          onRetry={refetch}
          isError
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: `Edit ${category.name}`,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: THEME.COLORS.BACKGROUND,
          },
          headerTitleStyle: {
            color: THEME.COLORS.TEXT_PRIMARY,
          },
          presentation: 'modal',
        }}
      />
      <CategoryForm initialData={category} isEdit />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});