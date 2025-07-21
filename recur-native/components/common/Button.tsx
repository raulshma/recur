import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { THEME } from '@/constants/config';
import { ButtonProps } from '@/types';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? 'white' : THEME.COLORS.PRIMARY}
          />
        ) : (
          <>
            {icon && <Text style={[textStyle, styles.icon]}>{icon}</Text>}
            <Text style={textStyle}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: THEME.SPACING.SM,
  },
  
  // Variants
  primary: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  secondary: {
    backgroundColor: THEME.COLORS.SECONDARY,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  small: {
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: THEME.SPACING.LG,
    paddingVertical: THEME.SPACING.MD,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: THEME.SPACING.XL,
    paddingVertical: THEME.SPACING.LG,
    minHeight: 52,
  },
  
  // Text variants
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  outlineText: {
    color: THEME.COLORS.PRIMARY,
  },
  ghostText: {
    color: THEME.COLORS.PRIMARY,
  },
  
  // Text sizes
  smallText: {
    fontSize: THEME.FONT_SIZES.SM,
  },
  mediumText: {
    fontSize: THEME.FONT_SIZES.MD,
  },
  largeText: {
    fontSize: THEME.FONT_SIZES.LG,
  },
  
  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});