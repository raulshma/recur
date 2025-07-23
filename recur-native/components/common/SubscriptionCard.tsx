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
import { Subscription, BillingCycle } from '@/types';
import { Card } from './Card';

export interface SubscriptionCardProps {
  subscription: Subscription;
  onPress: (subscription: Subscription) => void;
  onEdit?: ((subscription: Subscription) => void) | undefined;
  onCancel?: ((subscription: Subscription) => void) | undefined;
  onDelete?: ((subscription: Subscription) => void) | undefined;
  onReactivate?: ((subscription: Subscription) => void) | undefined;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
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

  const getBillingCycleText = (billingCycle: BillingCycle) => {
    switch (billingCycle) {
      case BillingCycle.Weekly:
        return 'Weekly';
      case BillingCycle.Monthly:
        return 'Monthly';
      case BillingCycle.Quarterly:
        return 'Quarterly';
      case BillingCycle.SemiAnnually:
        return 'Semi-Annually';
      case BillingCycle.Annually:
        return 'Annually';
      case BillingCycle.Biannually:
        return 'Biannually';
      default:
        return 'Unknown';
    }
  };

  const getStatusIndicator = () => {
    if (!subscription.isActive) {
      return { color: THEME.COLORS.ERROR, text: 'Cancelled' };
    }
    if (subscription.isTrial) {
      return { color: THEME.COLORS.WARNING, text: 'Trial' };
    }
    return { color: THEME.COLORS.SUCCESS, text: 'Active' };
  };

  const statusIndicator = getStatusIndicator();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const actions = [];

    if (onEdit) {
      actions.push(
        <Animated.View
          key="edit"
          style={[
            styles.actionButton,
            {
              backgroundColor: THEME.COLORS.PRIMARY,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => onEdit(subscription)}
            style={styles.actionButtonInner}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (subscription.isActive && onCancel) {
      actions.push(
        <Animated.View
          key="cancel"
          style={[
            styles.actionButton,
            {
              backgroundColor: THEME.COLORS.WARNING,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => onCancel(subscription)}
            style={styles.actionButtonInner}
          >
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (!subscription.isActive && onReactivate) {
      actions.push(
        <Animated.View
          key="reactivate"
          style={[
            styles.actionButton,
            {
              backgroundColor: THEME.COLORS.SUCCESS,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => onReactivate(subscription)}
            style={styles.actionButtonInner}
          >
            <Text style={styles.actionText}>Reactivate</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (onDelete) {
      actions.push(
        <Animated.View
          key="delete"
          style={[
            styles.actionButton,
            {
              backgroundColor: THEME.COLORS.ERROR,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => onDelete(subscription)}
            style={styles.actionButtonInner}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <View style={styles.actionsContainer}>
        {actions}
      </View>
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
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: statusIndicator.color },
                  ]}
                >
                  <Text style={styles.statusText}>{statusIndicator.text}</Text>
                </View>
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
                  {getBillingCycleText(subscription.billingCycle)}
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

              {subscription.daysUntilNextBilling <= 7 && subscription.isActive && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>
                    {subscription.daysUntilNextBilling === 0
                      ? 'Due today'
                      : subscription.daysUntilNextBilling === 1
                      ? 'Due tomorrow'
                      : `Due in ${subscription.daysUntilNextBilling} days`}
                  </Text>
                </View>
              )}
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
  },
  statusIndicator: {
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS / 2,
    borderRadius: THEME.BORDER_RADIUS.SM,
    marginLeft: THEME.SPACING.SM,
  },
  statusText: {
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
    color: 'white',
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
  countdownContainer: {
    backgroundColor: THEME.COLORS.WARNING + '20',
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS / 2,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  countdownText: {
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
    color: THEME.COLORS.WARNING,
  },
  actionsContainer: {
    width: 200,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: THEME.FONT_SIZES.SM,
    textAlign: 'center',
  },
});