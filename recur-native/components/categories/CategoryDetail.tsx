import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { THEME } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types';
import { useRouter } from 'expo-router';
import { useDeleteCategory } from '@/hooks/useCategories';

interface CategoryDetailProps {
  category: Category;
  isLoading: boolean;
  subscriptionCount: number;
  onRefresh: () => void;
}

export const CategoryDetail: React.FC<CategoryDetailProps> = ({
  category,
  isLoading,
  subscriptionCount,
  onRefresh: _onRefresh,
}) => {
  const router = useRouter();
  const deleteCategory = useDeleteCategory();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/modals/edit-category?id=${category.id}`);
  };

  const handleDelete = () => {
    if (category.isDefault) {
      Alert.alert(
        'Cannot Delete Default Category',
        'Default categories cannot be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (subscriptionCount > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `This category has ${subscriptionCount} subscription(s) assigned to it. Please reassign or delete these subscriptions first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteCategory.mutateAsync(category.id);
              Alert.alert('Success', 'Category deleted successfully');
              router.back();
            } catch (error: any) {
              const errorMessage = error?.message || 'An error occurred';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View
          style={[styles.colorIndicator, { backgroundColor: category.color }]}
        />
        <Text style={styles.categoryName}>{category.name}</Text>
        {category.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {category.description || 'No description provided'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Subscriptions:</Text>
          <Text style={styles.detailValue}>{subscriptionCount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {new Date(category.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {category.isDefault && (
          <View style={styles.warningContainer}>
            <Ionicons name="information-circle" size={20} color={THEME.COLORS.WARNING} />
            <Text style={styles.warningText}>
              This is a default category and cannot be edited or deleted.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
          disabled={isDeleting || category.isDefault}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.deleteButton,
            (isDeleting || category.isDefault || subscriptionCount > 0) && styles.disabledButton,
          ]}
          onPress={handleDelete}
          disabled={isDeleting || category.isDefault || subscriptionCount > 0}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.buttonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: THEME.SPACING.MD,
  },
  categoryName: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: THEME.COLORS.PRIMARY_LIGHT,
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  defaultText: {
    color: THEME.COLORS.PRIMARY,
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
  },
  section: {
    padding: THEME.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  description: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.SM,
  },
  detailLabel: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.WARNING_LIGHT,
    padding: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginTop: THEME.SPACING.MD,
  },
  warningText: {
    color: THEME.COLORS.WARNING,
    fontSize: THEME.FONT_SIZES.SM,
    marginLeft: THEME.SPACING.SM,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: THEME.SPACING.LG,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.SPACING.MD,
    paddingHorizontal: THEME.SPACING.LG,
    borderRadius: THEME.BORDER_RADIUS.MD,
    flex: 1,
  },
  editButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    marginRight: THEME.SPACING.MD,
  },
  deleteButton: {
    backgroundColor: THEME.COLORS.ERROR,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: THEME.FONT_SIZES.MD,
    marginLeft: THEME.SPACING.SM,
  },
  disabledButton: {
    opacity: 0.5,
  },
});