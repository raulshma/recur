import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';

export default function BiometricSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Setup</Text>
      <Text style={styles.subtitle}>
        This screen will be implemented in the Authentication System Implementation task
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
    padding: THEME.SPACING.LG,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});