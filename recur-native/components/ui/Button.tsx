import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { THEME } from '@/constants/config';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return THEME.COLORS.DISABLED;
    
    switch (variant) {
      case 'primary':
        return THEME.COLORS.PRIMARY;
      case 'secondary':
        return THEME.COLORS.SECONDARY;
      case 'outline':
        return 'transparent';
      case 'danger':
        return THEME.COLORS.ERROR;
      default:
        return THEME.COLORS.PRIMARY;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return '#FFFFFF';
    
    switch (variant) {
      case 'outline':
        return THEME.COLORS.PRIMARY;
      default:
        return '#FFFFFF';
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return THEME.COLORS.DISABLED;
    
    switch (variant) {
      case 'outline':
        return THEME.COLORS.PRIMARY;
      default:
        return 'transparent';
    }
  };
  
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: THEME.SPACING.XS,
          paddingHorizontal: THEME.SPACING.MD,
          fontSize: THEME.FONT_SIZES.SM,
        };
      case 'large':
        return {
          paddingVertical: THEME.SPACING.MD,
          paddingHorizontal: THEME.SPACING.XL,
          fontSize: THEME.FONT_SIZES.LG,
        };
      default:
        return {
          paddingVertical: THEME.SPACING.SM,
          paddingHorizontal: THEME.SPACING.LG,
          fontSize: THEME.FONT_SIZES.MD,
        };
    }
  };
  
  const buttonSizeStyle = getButtonSize();
  
  const buttonStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    paddingVertical: buttonSizeStyle.paddingVertical,
    paddingHorizontal: buttonSizeStyle.paddingHorizontal,
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        variant === 'outline' && styles.outlineButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: buttonSizeStyle.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  outlineButton: {
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});