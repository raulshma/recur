import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/config';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string; // Ionicons name or emoji
  image?: ImageSourcePropType;
  actionText?: string;
  actionLabel?: string; // Added for backward compatibility
  onAction?: () => void;
  onRetry?: () => void;
  isError?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  image,
  actionText,
  actionLabel, // Added for backward compatibility
  onAction,
  onRetry,
  isError = false,
}) => {
  // Use actionLabel as fallback for actionText
  const buttonText = actionText || actionLabel;
  return (
    <View style={styles.container}>
      {icon && icon.includes('-') ? (
        <Ionicons name={icon as any} size={64} color={isError ? THEME.COLORS.ERROR : THEME.COLORS.TEXT_SECONDARY} style={styles.iconComponent} />
      ) : icon ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : null}
      
      {image && (
        <Image
          source={image}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      
      <Text style={[styles.title, isError && styles.errorTitle]}>
        {title}
      </Text>
      
      <Text style={styles.message}>{message}</Text>
      
      {buttonText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, isError && styles.errorActionButton]}
          onPress={onAction}
        >
          <Text style={[styles.actionLabel, isError && styles.errorActionLabel]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
      
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton]}
          onPress={onRetry}
        >
          <Text style={styles.retryLabel}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: THEME.SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  icon: {
    fontSize: 64,
    marginBottom: THEME.SPACING.LG,
  },
  iconComponent: {
    marginBottom: THEME.SPACING.LG,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: THEME.SPACING.LG,
    opacity: 0.8,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: THEME.SPACING.SM,
  },
  errorTitle: {
    color: THEME.COLORS.ERROR,
  },
  message: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: THEME.SPACING.LG,
    maxWidth: 300,
  },
  actionButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    paddingVertical: THEME.SPACING.SM,
    paddingHorizontal: THEME.SPACING.LG,
    borderRadius: THEME.BORDER_RADIUS.MD,
  },
  errorActionButton: {
    backgroundColor: THEME.COLORS.ERROR,
  },
  actionLabel: {
    color: 'white',
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
  },
  errorActionLabel: {
    color: 'white',
  },
  retryButton: {
    marginTop: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    paddingHorizontal: THEME.SPACING.LG,
  },
  retryLabel: {
    color: THEME.COLORS.PRIMARY,
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
  },
});