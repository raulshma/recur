import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/config';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { useSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions';
import { UpdateSubscriptionDto } from '@/types';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function EditSubscriptionModal() {
  const { subscriptionId } = useLocalSearchParams<{ subscriptionId: string }>();
  const id = parseInt(subscriptionId || '0', 10);
  
  const { data: subscription, isLoading, error } = useSubscription(id);
  const { mutateAsync: updateSubscription, isPending } = useUpdateSubscription();
  
  const handleSubmit = async (data: UpdateSubscriptionDto) => {
    await updateSubscription({ id, data });
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !subscription) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <ErrorMessage message="Failed to load subscription details. Please try again." />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Subscription</Text>
        </View>
        
        <SubscriptionForm
          initialData={subscription}
          onSubmit={handleSubmit}
          isLoading={isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    padding: THEME.SPACING.MD,
    backgroundColor: THEME.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
    padding: THEME.SPACING.LG,
  },
  loadingText: {
    marginTop: THEME.SPACING.MD,
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
    padding: THEME.SPACING.LG,
  },
  errorTitle: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: THEME.COLORS.ERROR,
    marginBottom: THEME.SPACING.MD,
  },
});