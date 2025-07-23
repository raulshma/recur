import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '@/constants/config';
import { Category } from '@/types';
import { Card } from './Card';

interface CategoryCardProps {
  category: Category;
  subscriptionCount: number;
  onPress: (category: Category) => void;
  style?: any;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  subscriptionCount,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(category)}
      style={[styles.container, style]}
    >
      <Card style={styles.card}>
        <View style={[styles.colorIndicator, { backgroundColor: category.color }]} />
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {category.description || 'No description'}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.subscriptionCount}>
              {subscriptionCount}{' '}
              <Text style={styles.subscriptionText}>
                {subscriptionCount === 1 ? 'subscription' : 'subscriptions'}
              </Text>
            </Text>
            {category.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SPACING.MD,
    flex: 1,
  },
  card: {
    overflow: 'hidden',
    height: 140,
  },
  colorIndicator: {
    height: 8,
    width: '100%',
  },
  content: {
    padding: THEME.SPACING.MD,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.XS,
  },
  description: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.SPACING.SM,
  },
  subscriptionCount: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  subscriptionText: {
    fontWeight: 'normal',
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  defaultBadge: {
    backgroundColor: THEME.COLORS.PRIMARY + '20',
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS / 2,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  defaultText: {
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
    color: THEME.COLORS.PRIMARY,
  },
});