import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { THEME } from '@/constants/config';

interface SwipeAction {
  text: string;
  color: string;
  onPress: () => void;
}

interface SwipeActionsProps {
  actions: SwipeAction[];
  progress: Animated.AnimatedInterpolation<number>;
  dragX: Animated.AnimatedInterpolation<number>;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({
  actions,
  progress,
  dragX,
}) => {
  const trans = dragX.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.actionsContainer}>
      {actions.map((action, index) => (
        <Animated.View
          key={index}
          style={[
            styles.actionButton,
            {
              backgroundColor: action.color,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={action.onPress}
            style={styles.actionButtonInner}
          >
            <Text style={styles.actionText}>{action.text}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    width: 200,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: THEME.FONT_SIZES.SM,
    textAlign: 'center',
  },
});

export default SwipeActions;