import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '@/constants/config';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = 'Try Again',
  type = 'error',
}) => {
  const getContainerStyle = () => {
    switch (type) {
      case 'warning':
        return [styles.container, styles.warningContainer];
      case 'info':
        return [styles.container, styles.infoContainer];
      default:
        return [styles.container, styles.errorContainer];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <View style={getContainerStyle()}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.SM,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: THEME.COLORS.ERROR,
  },
  warningContainer: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: THEME.COLORS.WARNING,
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: THEME.FONT_SIZES.LG,
    marginRight: THEME.SPACING.SM,
  },
  message: {
    flex: 1,
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: THEME.SPACING.MD,
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    backgroundColor: THEME.COLORS.PRIMARY,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  retryText: {
    color: 'white',
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
  },
});