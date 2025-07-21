import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { THEME } from '@/constants/config';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
  error,
  required = false,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };
  
  const togglePicker = () => {
    if (!disabled) {
      setShowPicker(!showPicker);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const renderIOSPicker = () => {
    return (
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{label || 'Select Date'}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode="date"
              display="spinner"
              onChange={handleChange}
              {...(minimumDate && { minimumDate })}
              {...(maximumDate && { maximumDate })}
            />
          </View>
        </View>
      </Modal>
    );
  };
  
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
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        onPress={togglePicker}
        disabled={disabled}
      >
        <Text
          style={[
            value ? styles.dateText : styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {Platform.OS === 'ios' ? (
        renderIOSPicker()
      ) : (
        showPicker && (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            onChange={handleChange}
            {...(minimumDate && { minimumDate })}
            {...(maximumDate && { maximumDate })}
          />
        )
      )}
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
  input: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.MD,
    backgroundColor: THEME.COLORS.SURFACE,
    minHeight: 44,
  },
  inputError: {
    borderColor: THEME.COLORS.ERROR,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: THEME.COLORS.DISABLED,
    opacity: 0.7,
  },
  dateText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  disabledText: {
    color: THEME.COLORS.TEXT_SECONDARY,
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
  cancelButton: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  doneButton: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '600',
  },
});