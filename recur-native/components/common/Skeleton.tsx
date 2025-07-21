import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { THEME } from '@/constants/config';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = THEME.BORDER_RADIUS.SM,
  style,
  animated = true,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }
    // Return empty function to satisfy useEffect return type
    return () => {};
  }, [animated, opacity]);

  // Create a style object with proper typing
  const skeletonStyle: any = {
    width,
    height,
    borderRadius,
    opacity,
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        skeletonStyle,
        style,
      ]}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  width?: number | string | Array<number | string>;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  spacing = THEME.SPACING.SM,
  width = '100%',
  style,
}) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array(lines)
        .fill(0)
        .map((_, index) => {
          // If width is an array, use the corresponding width or the last one
          const lineWidth = Array.isArray(width)
            ? width[index] || width[width.length - 1]
            : index === lines - 1 && typeof width === 'number'
            ? width * 0.7 // Make last line shorter if width is a number
            : width;

          return (
            <Skeleton
              key={index}
              width={lineWidth || '100%'} // Provide default to avoid undefined
              height={lineHeight}
              style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
            />
          );
        })}
    </View>
  );
};

interface SkeletonCardProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 120,
  style,
}) => {
  return (
    <View style={[styles.card, { height }, style]}>
      <SkeletonText lines={2} width={['70%', '90%']} />
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={24} borderRadius={THEME.BORDER_RADIUS.MD} />
        <Skeleton width={60} height={24} borderRadius={THEME.BORDER_RADIUS.MD} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: THEME.COLORS.BORDER, // Using BORDER color as a fallback for DISABLED
  },
  textContainer: {
    width: '100%',
  },
  card: {
    padding: THEME.SPACING.MD,
    backgroundColor: THEME.COLORS.BACKGROUND, // Using BACKGROUND color as a fallback for CARD
    borderRadius: THEME.BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    justifyContent: 'space-between',
    marginVertical: THEME.SPACING.SM,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SPACING.MD,
  },
});