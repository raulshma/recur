import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/config';
import { CategoryCard } from '@/components/common/CategoryCard';
import { Category } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { useRouter } from 'expo-router';

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  isError,
  onRefresh,
  refreshing
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCategoryPress = (category: Category) => {
    router.push(`/categories/${category.id}`);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error Loading Categories"
        message="There was a problem loading your categories. Pull down to try again."
        onRetry={onRefresh}
      />
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon="folder-outline"
        title="No Categories Found"
        message="You haven't created any categories yet. Create your first category to organize your subscriptions."
        actionText="Create Category"
        onAction={() => router.push('/modals/add-category')}
      />
    );
  }

  const renderItem = ({ item }: { item: Category }) => {
    // Count subscriptions for this category (this would be provided by a real API)
    const subscriptionCount = 0; // Placeholder, would come from API
    
    return (
      <CategoryCard
        category={item}
        subscriptionCount={subscriptionCount}
        onPress={handleCategoryPress}
        style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
          onPress={() => setViewMode('grid')}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={viewMode === 'grid' ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={viewMode === 'list' ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  toggleButton: {
    padding: THEME.SPACING.SM,
    marginLeft: THEME.SPACING.SM,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  activeToggle: {
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  listContent: {
    padding: THEME.SPACING.MD,
  },
  gridItem: {
    width: '48%',
    margin: '1%',
  },
  listItem: {
    width: '100%',
    marginBottom: THEME.SPACING.MD,
  },
});