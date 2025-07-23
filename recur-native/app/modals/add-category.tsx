import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';
import { Stack } from 'expo-router';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddCategoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Add Category',
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
      <CategoryForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
});