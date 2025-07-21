import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { THEME } from '@/constants/config';

// Predefined color palette
const COLORS = [
  // Blues
  '#007AFF', '#0A84FF', '#5AC8FA', '#64D2FF', '#0071E3',
  // Greens
  '#34C759', '#30D158', '#32D74B', '#00C7BE', '#59ADC4',
  // Reds
  '#FF3B30', '#FF453A', '#FF9500', '#FF9F0A', '#FFD60A',
  // Purples
  '#5856D6', '#5E5CE6', '#BF5AF2', '#C969E0', '#DA8FFF',
  // Grays
  '#8E8E93', '#636366', '#48484A', '#3A3A3C', '#2C2C2E',
  // Other
  '#FF2D55', '#FF375F', '#FF6482', '#FF9F0A', '#FFCC00',
];

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleSelect = (color: string) => {
    onChange(color);
    setModalVisible(false);
  };
  
  const renderColorItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.colorItem,
        { backgroundColor: item },
        item === value && styles.selectedColorItem,
      ]}
      onPress={() => handleSelect(item)}
    >
      {item === value && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );
  
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 5;
  const colorItemSize = (screenWidth - (THEME.SPACING.MD * 2) - (THEME.SPACING.SM * (numColumns - 1))) / numColumns;
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.colorPreview,
          error && styles.colorPreviewError,
          disabled && styles.colorPreviewDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={[styles.selectedColor, { backgroundColor: value || '#CCCCCC' }]} />
        <Text style={styles.colorText}>{value || 'Select a color'}</Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Color</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COLORS}
              renderItem={renderColorItem}
              keyExtractor={item => item}
              numColumns={numColumns}
              style={styles.colorList}
              contentContainerStyle={styles.colorListContent}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SPACING.MD,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.XS,
  },
  label: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  required: {
    color: THEME.COLORS.ERROR,
    marginLeft: THEME.SPACING.XS,
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
  },
  colorPreview: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.MD,
    backgroundColor: THEME.COLORS.SURFACE,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreviewError: {
    borderColor: THEME.COLORS.ERROR,
    borderWidth: 2,
  },
  colorPreviewDisabled: {
    backgroundColor: THEME.COLORS.DISABLED,
    opacity: 0.7,
  },
  selectedColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: THEME.SPACING.MD,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  errorText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.ERROR,
    marginTop: THEME.SPACING.XS,
    marginLeft: THEME.SPACING.XS,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderTopLeftRadius: THEME.BORDER_RADIUS.LG,
    borderTopRightRadius: THEME.BORDER_RADIUS.LG,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  modalTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: THEME.SPACING.SM,
  },
  closeButtonText: {
    fontSize: THEME.FONT_SIZES.LG,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  colorList: {
    flex: 1,
  },
  colorListContent: {
    padding: THEME.SPACING.MD,
  },
  colorItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: THEME.SPACING.XS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedColorItem: {
    borderWidth: 2,
    borderColor: THEME.COLORS.TEXT_PRIMARY,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});