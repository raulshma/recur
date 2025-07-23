import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { THEME } from '@/constants/config';
import { useSubscription, useSubscriptionHistory, useCancelSubscription, useDeleteSubscription, useReactivateSubscription } from '@/hooks/useSubscriptions';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, EmptyState } from '@/components/common';
import { SubscriptionStatusBadge, NextBillingCountdown } from '@/components/subscriptions';
import { ThemedView } from '@/components/ThemedView';
import { processSubscriptionHistory } from '@/utils/subscriptionUtils';

export const SubscriptionDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriptionId = parseInt(id || '0', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showHistory, setShowHistory] = useState(false);

  // Fetch subscription details
  const { data: subscription, isLoading, isError } = useSubscription(subscriptionId);
  
  // Fetch subscription history
  const { 
    data: historyData, 
    isLoading: isHistoryLoading 
  } = useSubscriptionHistory(subscriptionId);

  // Process history data
  const history = historyData ? processSubscriptionHistory(historyData) : [];

  // Mutation hooks
  const { mutate: cancelSubscription } = useCancelSubscription();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { mutate: reactivateSubscription } = useReactivateSubscription();

  // Handle edit subscription
  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/modals/edit-subscription',
      params: { subscriptionId }
    });
  }, [router, subscriptionId]);

  // Handle cancel subscription
  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            cancelSubscription(subscriptionId);
          }
        }
      ]
    );
  }, [cancelSubscription, subscriptionId]);

  // Handle delete subscription
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            deleteSubscription(subscriptionId);
            router.back();
          }
        }
      ]
    );
  }, [deleteSubscription, subscriptionId, router]);

  // Handle reactivate subscription
  const handleReactivate = useCallback(() => {
    Alert.alert(
      'Reactivate Subscription',
      'Are you sure you want to reactivate this subscription?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            reactivateSubscription(subscriptionId);
          }
        }
      ]
    );
  }, [reactivateSubscription, subscriptionId]);

  // Handle website link
  const handleOpenWebsite = useCallback(() => {
    if (subscription?.website) {
      Linking.openURL(subscription.website);
    }
  }, [subscription]);

  // Handle email link
  const handleSendEmail = useCallback(() => {
    if (subscription?.contactEmail) {
      Linking.openURL(`mailto:${subscription.contactEmail}`);
    }
  }, [subscription]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Toggle history visibility
  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (isError || !subscription) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          title="Subscription not found"
          message="We couldn't find the subscription you're looking for."
          actionLabel="Go Back"
          onAction={handleBack}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {subscription.name}
        </Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="pencil" size={24} color={THEME.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.card}>
          <View style={styles.statusContainer}>
            <View style={styles.statusHeader}>
              <Text style={styles.cardTitle}>Status</Text>
              <SubscriptionStatusBadge 
                isActive={subscription.isActive}
                isTrial={subscription.isTrial}
                size="medium"
              />
            </View>

            <View style={styles.statusDetails}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Next billing:</Text>
                <Text style={styles.statusValue}>
                  {formatDate(subscription.nextBillingDate)}
                </Text>
              </View>

              <NextBillingCountdown
                daysUntilNextBilling={subscription.daysUntilNextBilling}
                isActive={subscription.isActive}
                size="medium"
              />

              {subscription.trialEndDate && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Trial ends:</Text>
                  <Text style={styles.statusValue}>
                    {formatDate(subscription.trialEndDate)}
                  </Text>
                </View>
              )}

              {subscription.cancellationDate && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Cancelled on:</Text>
                  <Text style={styles.statusValue}>
                    {formatDate(subscription.cancellationDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Cost Card */}
        <Card style={styles.card}>
          <View style={styles.costContainer}>
            <Text style={styles.cardTitle}>Cost</Text>
            <View style={styles.costDetails}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Amount:</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(subscription.cost, subscription.currency)}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Billing cycle:</Text>
                <Text style={styles.costValue}>{subscription.billingCycleText}</Text>
              </View>
              {subscription.isConverted && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Converted:</Text>
                  <View style={styles.convertedContainer}>
                    <Text style={styles.costValue}>
                      {formatCurrency(
                        subscription.convertedCost || 0,
                        subscription.convertedCurrency || ''
                      )}
                    </Text>
                    {subscription.isRateStale && (
                      <Text style={styles.staleRate}>*</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card style={styles.card}>
          <View style={styles.detailsContainer}>
            <Text style={styles.cardTitle}>Details</Text>
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <View style={styles.categoryContainer}>
                  <View
                    style={[
                      styles.categoryColor,
                      { backgroundColor: subscription.category.color },
                    ]}
                  />
                  <Text style={styles.detailValue}>{subscription.category.name}</Text>
                </View>
              </View>

              {subscription.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{subscription.description}</Text>
                </View>
              )}

              {subscription.website && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Website:</Text>
                  <TouchableOpacity onPress={handleOpenWebsite}>
                    <Text style={styles.linkText}>{subscription.website}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {subscription.contactEmail && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <TouchableOpacity onPress={handleSendEmail}>
                    <Text style={styles.linkText}>{subscription.contactEmail}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {subscription.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{subscription.notes}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.createdAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last updated:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* History Card */}
        <Card style={styles.card}>
          <TouchableOpacity onPress={toggleHistory} style={styles.historyHeader}>
            <Text style={styles.cardTitle}>History</Text>
            <Ionicons
              name={showHistory ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={THEME.COLORS.TEXT_PRIMARY}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyContent}>
              {isHistoryLoading ? (
                <ActivityIndicator size="small" color={THEME.COLORS.PRIMARY} />
              ) : history.length > 0 ? (
                history.map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemDate}>
                        {formatDate(item.date)}
                      </Text>
                      <Text style={styles.historyItemAction}>{item.action}</Text>
                    </View>
                    {item.changes.length > 0 && (
                      <View style={styles.historyItemChanges}>
                        {item.changes.map((change, changeIndex) => (
                          <Text key={changeIndex} style={styles.historyItemChange}>
                            • {change}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No history available</Text>
              )}
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {subscription.isActive ? (
            <Button
              title="Cancel Subscription"
              onPress={handleCancel}
              variant="outline"
              size="medium"
            />
          ) : (
            <Button
              title="Reactivate Subscription"
              onPress={handleReactivate}
              variant="primary"
              size="medium"
            />
          )}
          <Button
            title="Delete Subscription"
            onPress={handleDelete}
            variant="outline"
            size="medium"

          />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.LG,
    paddingVertical: THEME.SPACING.MD,
  },
  backButton: {
    padding: THEME.SPACING.SM,
  },
  title: {
    flex: 1,
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: THEME.SPACING.MD,
  },
  editButton: {
    padding: THEME.SPACING.SM,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.SPACING.LG,
    paddingBottom: THEME.SPACING.LG + 20, // Fixed value instead of dynamic insets
  },
  card: {
    marginBottom: THEME.SPACING.LG,
  },
  cardTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  statusContainer: {
    padding: THEME.SPACING.LG,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM / 2,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
    color: 'white',
  },
  statusDetails: {
    marginTop: THEME.SPACING.MD,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.SM,
  },
  statusLabel: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  statusValue: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  countdownContainer: {
    backgroundColor: THEME.COLORS.WARNING + '20',
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    borderRadius: THEME.BORDER_RADIUS.SM,
    alignSelf: 'flex-start',
    marginBottom: THEME.SPACING.SM,
  },
  countdownText: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
    color: THEME.COLORS.WARNING,
  },
  costContainer: {
    padding: THEME.SPACING.LG,
  },
  costDetails: {
    marginTop: THEME.SPACING.SM,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.SM,
  },
  costLabel: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  costValue: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  convertedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staleRate: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.WARNING,
    marginLeft: 4,
  },
  detailsContainer: {
    padding: THEME.SPACING.LG,
  },
  detailsContent: {
    marginTop: THEME.SPACING.SM,
  },
  detailRow: {
    marginBottom: THEME.SPACING.MD,
  },
  detailLabel: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SPACING.XS,
  },
  detailValue: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: THEME.SPACING.SM,
  },
  linkText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.PRIMARY,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.LG,
  },
  historyContent: {
    paddingHorizontal: THEME.SPACING.LG,
    paddingBottom: THEME.SPACING.LG,
  },
  historyItem: {
    marginBottom: THEME.SPACING.MD,
    paddingBottom: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.SM,
  },
  historyItemDate: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  historyItemAction: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  historyItemChanges: {
    marginTop: THEME.SPACING.XS,
  },
  historyItemChange: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.XS,
  },
  noHistoryText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingVertical: THEME.SPACING.MD,
  },
  actionButtons: {
    marginTop: THEME.SPACING.MD,
  },
  deleteButton: {
    marginTop: THEME.SPACING.MD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionDetailScreen;