import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Text,
} from 'react-native';
import { THEME } from '@/constants/config';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  title,
  subtitle,
  footer,
  disabled = false,
  testID,
}) => {
  // Create a variable to hold the variant style
  let variantStyle = {};
  switch (variant) {
    case 'default':
      variantStyle = styles.default;
      break;
    case 'outlined':
      variantStyle = styles.outlined;
      break;
    case 'elevated':
      variantStyle = styles.elevated;
      break;
  }

  const cardStyle = [
    styles.card,
    variantStyle,
    disabled && styles.disabled,
    style,
  ];

  const CardComponent = onPress ? TouchableOpacity : View;
  const cardProps = onPress
    ? {
        activeOpacity: 0.7,
        onPress: disabled ? undefined : onPress,
        disabled,
      }
    : {};

  return (
    <CardComponent style={cardStyle} {...cardProps} testID={testID}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.BORDER_RADIUS.LG,
    backgroundColor: THEME.COLORS.BACKGROUND,
    overflow: 'hidden',
    marginVertical: THEME.SPACING.SM,
  },
  default: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
  },
  outlined: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    padding: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  title: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.XS,
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  content: {
    padding: THEME.SPACING.MD,
  },
  footer: {
    padding: THEME.SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER,
    backgroundColor: THEME.COLORS.SURFACE,
  },
});