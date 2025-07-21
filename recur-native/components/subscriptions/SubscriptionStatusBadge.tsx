import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';

interface SubscriptionStatusBadgeProps {
  isActive: boolean;
  isTrial: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  isActive,
  isTrial,
  size = 'medium',
}) => {
  const getStatusInfo = () => {
    if (!isActive) {
      return { color: THEME.COLORS.ERROR, text: 'Cancelled' };
    }
    if (isTrial) {
      return { color: THEME.COLORS.WARNING, text: 'Trial' };
    }
    return { color: THEME.COLORS.SUCCESS, text: 'Active' };
  };

  const statusInfo = getStatusInfo();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingHorizontal: THEME.SPACING.SM,
            paddingVertical: THEME.SPACING.XS / 2,
            borderRadius: THEME.BORDER_RADIUS.SM,
          },
          text: {
            fontSize: THEME.FONT_SIZES.XS,
          },
        };
      case 'large':
        return {
          container: {
            paddingHorizontal: THEME.SPACING.LG,
            paddingVertical: THEME.SPACING.SM,
            borderRadius: THEME.BORDER_RADIUS.MD,
          },
          text: {
            fontSize: THEME.FONT_SIZES.MD,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: THEME.SPACING.MD,
            paddingVertical: THEME.SPACING.SM / 2,
            borderRadius: THEME.BORDER_RADIUS.SM,
          },
          text: {
            fontSize: THEME.FONT_SIZES.SM,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: statusInfo.color },
        sizeStyles.container,
      ]}
    >
      <Text style={[styles.text, sizeStyles.text]}>{statusInfo.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    color: 'white',
  },
});

export default SubscriptionStatusBadge;