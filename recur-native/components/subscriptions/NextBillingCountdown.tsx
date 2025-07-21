import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';

interface NextBillingCountdownProps {
  daysUntilNextBilling: number;
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const NextBillingCountdown: React.FC<NextBillingCountdownProps> = ({
  daysUntilNextBilling,
  isActive,
  size = 'medium',
}) => {
  // Don't show countdown for inactive subscriptions or if more than 7 days away
  if (!isActive || daysUntilNextBilling > 7) {
    return null;
  }

  const getCountdownText = () => {
    if (daysUntilNextBilling === 0) {
      return 'Due today';
    } else if (daysUntilNextBilling === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysUntilNextBilling} days`;
    }
  };

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
        sizeStyles.container,
      ]}
    >
      <Text style={[styles.text, sizeStyles.text]}>{getCountdownText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.WARNING + '20',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    color: THEME.COLORS.WARNING,
  },
});

export default NextBillingCountdown;