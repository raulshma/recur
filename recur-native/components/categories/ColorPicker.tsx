import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { THEME } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';

export interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  disabled: boolean;
}

// Predefined color palette
const COLORS = [
  '#FF6B6B', // Red
  '#FF9E7A', // Coral
  '#FFCA80', // Orange
  '#FFE066', // Yellow
  '#A5D6A7', // Light Green
  '#4CAF50', // Green
  '#81D4FA', // Light Blue
  '#2196F3', // Blue
  '#9575CD', // Purple
  '#BA68C8', // Pink
  '#F06292', // Light Pink
  '#E57373', // Light Red
  '#4DB6AC', // Teal
  '#26A69A', // Dark Teal
  '#78909C', // Blue Grey
  '#607D8B', // Dark Blue Grey
  '#8D6E63', // Brown
  '#6D4C41', // Dark Brown
  '#212121', // Black
  '#757575', // Grey
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  disabled = false,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColor,
            disabled && styles.disabledColor,
          ]}
          onPress={() => !disabled && onSelectColor(color)}
          disabled={disabled}
        >
          {selectedColor === color && (
            <Ionicons name="checkmark" size={18} color="white" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 100,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: THEME.SPACING.SM,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: THEME.SPACING.XS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  disabledColor: {
    opacity: 0.5,
  },
});