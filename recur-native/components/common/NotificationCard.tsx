import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '@/constants/config';
import { Notification } from '@/types';
import { Card } from './Card';

interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onDismiss?: (notification: Notification) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'bill_due':
        return THEME.COLORS.PRIMARY;
      case 'trial_ending':
        return THEME.COLORS.WARNING;
      case 'budget_alert':
        return THEME.COLORS.ERROR;
      default:
        return THEME.COLORS.SECONDARY;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'bill_due':
        return '💰';
      case 'trial_ending':
        return '⏱️';
      case 'budget_alert':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    
    // If today
    if (
      now.getDate() === notificationDate.getDate() &&
      now.getMonth() === notificationDate.getMonth() &&
      now.getFullYear() === notificationDate.getFullYear()
    ) {
      return `Today, ${notificationDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getDate() === notificationDate.getDate() &&
      yesterday.getMonth() === notificationDate.getMonth() &&
      yesterday.getFullYear() === notificationDate.getFullYear()
    ) {
      return `Yesterday, ${notificationDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    
    // If within the last 7 days
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (notificationDate >= oneWeekAgo) {
      return notificationDate.toLocaleDateString(undefined, {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // Otherwise, show full date
    return notificationDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(notification)}
    >
      <Card style={[styles.card, !notification.isRead && styles.unreadCard]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getNotificationTypeColor(notification.type) + '20' },
              ]}
            >
              <Text style={styles.icon}>{getNotificationTypeIcon(notification.type)}</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.timestamp}>
                {formatDate(notification.createdAt)}
              </Text>
            </View>
            {!notification.isRead && <View style={styles.unreadIndicator} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onPress(notification)}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: getNotificationTypeColor(notification.type) },
                ]}
              >
                View Details
              </Text>
            </TouchableOpacity>

            {onDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => onDismiss(notification)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.SPACING.MD,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.COLORS.PRIMARY,
  },
  container: {
    padding: THEME.SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.SM,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.SM,
  },
  icon: {
    fontSize: THEME.FONT_SIZES.LG,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  timestamp: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.PRIMARY,
    marginLeft: THEME.SPACING.SM,
  },
  message: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: THEME.SPACING.XS,
    paddingHorizontal: THEME.SPACING.SM,
    borderRadius: THEME.BORDER_RADIUS.SM,
  },
  actionText: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: THEME.SPACING.XS,
    paddingHorizontal: THEME.SPACING.SM,
    marginLeft: THEME.SPACING.MD,
  },
  dismissText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
});