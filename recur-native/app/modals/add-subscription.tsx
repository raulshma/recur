import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME } from '@/constants/config';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { useCreateSubscription } from '@/hooks/useSubscriptions';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '@/types';
import { StatusBar } from 'expo-status-bar';

export default function AddSubscriptionModal() {
  const { mutateAsync: createSubscription, isPending } = useCreateSubscription();
  
  // Handle both create and update subscription data
  const handleSubmit = async (data: CreateSubscriptionDto | UpdateSubscriptionDto) => {
    // For add modal, we only expect CreateSubscriptionDto
    await createSubscription(data as CreateSubscriptionDto);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Subscription</Text>
        </View>
        
        <SubscriptionForm
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
});