import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { THEME } from '@/constants/config';
import { Subscription } from '@/types';
import { Card } from '@/components/common';
import { SubscriptionStatusBadge, NextBillingCountdown, SwipeActions } from '@/components/subscriptions';

interface EnhancedSubscriptionCardProps {
  subscription: Subscription;
  onPress: (subscription: Subscription) => void;
  onEdit?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  onReactivate?: (subscription: Subscription) => void;
}

export const EnhancedSubscriptionCard: React.FC<EnhancedSubscriptionCardProps> = ({
  subscription,
  onPress,
  onEdit,
  onCancel,
  onDelete,
  onReactivate,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const actions = [];

    if (onEdit) {
      actions.push({
        text: 'Edit',
        color: THEME.COLORS.PRIMARY,
        onPress: () => onEdit(subscription),
      });
    }

    if (subscription.isActive && onCancel) {
      actions.push({
        text: 'Cancel',
        color: THEME.COLORS.WARNING,
        onPress: () => onCancel(subscription),
      });
    }

    if (!subscription.isActive && onReactivate) {
      actions.push({
        text: 'Reactivate',
        color: THEME.COLORS.SUCCESS,
        onPress: () => onReactivate(subscription),
      });
    }

    if (onDelete) {
      actions.push({
        text: 'Delete',
        color: THEME.COLORS.ERROR,
        onPress: () => onDelete(subscription),
      });
    }

    return (
      <SwipeActions
        actions={actions}
        progress={progress}
        dragX={dragX}
      />
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(subscription)}
      >
        <Card style={styles.card}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {subscription.name}
                </Text>
                <SubscriptionStatusBadge
                  isActive={subscription.isActive}
                  isTrial={subscription.isTrial}
                  size="small"
                />
              </View>
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: subscription.category.color },
                ]}
              />
            </View>

            <View style={styles.details}>
              <View style={styles.costContainer}>
                <Text style={styles.cost}>
                  {formatCurrency(subscription.cost, subscription.currency)}
                </Text>
                <Text style={styles.billingCycle}>
                  {subscription.billingCycleText}
                </Text>
              </View>

              {subscription.isConverted && (
                <View style={styles.convertedContainer}>
                  <Text style={styles.convertedCost}>
                    {formatCurrency(
                      subscription.convertedCost || 0,
                      subscription.convertedCurrency || ''
                    )}
                  </Text>
                  {subscription.isRateStale && (
                    <Text style={styles.staleRate}>*</Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <View style={styles.nextBillingContainer}>
                <Text style={styles.nextBillingLabel}>Next billing:</Text>
                <Text style={styles.nextBillingDate}>
                  {formatDate(subscription.nextBillingDate)}
                </Text>
              </View>

              <NextBillingCountdown
                daysUntilNextBilling={subscription.daysUntilNextBilling}
                isActive={subscription.isActive}
                size="small"
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.SPACING.MD,
    overflow: 'hidden',
  },
  container: {
    padding: THEME.SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.SM,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: THEME.SPACING.SM,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: THEME.SPACING.SM,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  costContainer: {
    flexDirection: 'column',
  },
  cost: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  billingCycle: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  convertedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convertedCost: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  staleRate: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.WARNING,
    marginLeft: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextBillingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBillingLabel: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginRight: THEME.SPACING.XS,
  },
  nextBillingDate: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
});

export default EnhancedSubscriptionCard;