import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Card } from '../common/Card';
import { THEME } from '@/constants/config';
import { Skeleton } from '../common/Skeleton';
import { formatCurrency } from '@/utils/currencyUtils';

interface TrendProps {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
}

const Trend: React.FC<TrendProps> = ({ direction, percentage }) => {
  // Define colors and icons based on direction
  const color = direction === 'up' 
    ? THEME.COLORS.ERROR  // Red for increase in cost (negative)
    : direction === 'down' 
      ? THEME.COLORS.SUCCESS // Green for decrease in cost (positive)
      : THEME.COLORS.TEXT_SECONDARY; // Gray for stable
  
  const icon = direction === 'up' 
    ? '↑' 
    : direction === 'down' 
      ? '↓' 
      : '→';
  
  return (
    <View style={[styles.trendContainer, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.trendIcon, { color }]}>{icon}</Text>
      <Text style={[styles.trendText, { color }]}>
        {percentage > 0 ? `${percentage}%` : 'No change'}
      </Text>
    </View>
  );
};

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  currency?: string;
  isLoading?: boolean;
  isCurrency?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  currency = 'USD',
  isLoading = false,
  isCurrency = false,
  style,
  onPress,
}) => {
  // Animation for value changes
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(value);
  
  useEffect(() => {
    if (displayValue.current !== value && !isLoading) {
      // Reset animation value
      animatedValue.setValue(0);
      
      // Update reference
      displayValue.current = value;
      
      // Animate to new value
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [value, isLoading, animatedValue]);
  
  // Format the value based on type
  const formattedValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value, currency)
    : typeof value === 'number'
      ? value.toLocaleString()
      : value;
  
  // Scale and opacity animations
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });
  
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0.7, 1, 1],
  });
  
  return (
    <Card 
      variant="elevated" 
      style={[styles.card, style]} 
      {...(onPress && { onPress })}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={16} style={styles.titleSkeleton} />
          <Skeleton width="80%" height={28} style={styles.valueSkeleton} />
          {subtitle && <Skeleton width="40%" height={14} style={styles.subtitleSkeleton} />}
        </View>
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          <Animated.Text 
            style={[
              styles.value, 
              { transform: [{ scale }], opacity }
            ]}
          >
            {formattedValue}
          </Animated.Text>
          
          <View style={styles.footer}>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
            
            {trend && (
              <Trend direction={trend.direction} percentage={trend.percentage} />
            )}
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.SM,
  },
  title: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SPACING.XS,
  },
  value: {
    fontSize: THEME.FONT_SIZES.XXL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.SM,
    paddingVertical: THEME.SPACING.XS,
    borderRadius: THEME.BORDER_RADIUS.MD,
  },
  trendIcon: {
    fontSize: THEME.FONT_SIZES.SM,
    marginRight: 2,
  },
  trendText: {
    fontSize: THEME.FONT_SIZES.XS,
    fontWeight: '600',
  },
  loadingContainer: {
    minHeight: 90,
    justifyContent: 'space-between',
  },
  titleSkeleton: {
    marginBottom: THEME.SPACING.SM,
  },
  valueSkeleton: {
    marginBottom: THEME.SPACING.MD,
  },
  subtitleSkeleton: {
    marginTop: THEME.SPACING.XS,
  },
});