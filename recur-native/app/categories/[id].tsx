import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategory } from '@/hooks/useCategories';
import { CategoryDetail } from '@/components/categories/CategoryDetail';
import { EmptyState } from '@/components/common/EmptyState';
import { useFocusEffect } from '@react-navigation/native';

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = id ? parseInt(id, 10) : 0;
  
  const { data: category, isLoading, isError, refetch } = useCategory(categoryId);

  // Refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // In a real app, we would fetch the subscription count for this category
  // For now, we'll use a placeholder value
  const subscriptionCount = 0;

  if (isError || (!isLoading && !category)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Category Details',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: THEME.COLORS.BACKGROUND,
            },
            headerTitleStyle: {
              color: THEME.COLORS.TEXT_PRIMARY,
            },
          }}
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Category Not Found"
          message="The category you're looking for doesn't exist or was deleted."
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
          title: category?.name || 'Category Details',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: THEME.COLORS.BACKGROUND,
          },
          headerTitleStyle: {
            color: THEME.COLORS.TEXT_PRIMARY,
          },
        }}
      />
      {category && (
        <CategoryDetail
          category={category}
          isLoading={isLoading}
          subscriptionCount={subscriptionCount}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
});