import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = THEME.COLORS.PRIMARY,
  message,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.LG,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  message: {
    marginTop: THEME.SPACING.MD,
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});