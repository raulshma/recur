import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '@/constants/config';

interface QuickActionButtonProps {
  title: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  disabled?: boolean;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}) => {
  // Determine button style based on variant
  let buttonStyle;
  let textStyle;
  
  switch (variant) {
    case 'primary':
      buttonStyle = styles.primaryButton;
      textStyle = styles.primaryText;
      break;
    case 'secondary':
      buttonStyle = styles.secondaryButton;
      textStyle = styles.secondaryText;
      break;
    case 'outline':
      buttonStyle = styles.outlineButton;
      textStyle = styles.outlineText;
      break;
    default:
      buttonStyle = styles.primaryButton;
      textStyle = styles.primaryText;
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <Text style={[styles.icon, textStyle]}>{icon}</Text>}
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

interface QuickActionGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const QuickActionGroup: React.FC<QuickActionGroupProps> = ({
  children,
  style,
}) => {
  return (
    <TouchableOpacity activeOpacity={1} style={[styles.group, style]}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.SPACING.SM,
    paddingHorizontal: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginHorizontal: THEME.SPACING.XS,
  },
  primaryButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: THEME.COLORS.SECONDARY,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: THEME.COLORS.PRIMARY,
  },
  icon: {
    marginRight: THEME.SPACING.XS,
    fontSize: THEME.FONT_SIZES.MD,
  },
  group: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: THEME.SPACING.MD,
  },
});