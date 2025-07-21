import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/config';
import { Input } from './Input';
import { FormFieldProps } from '@/types';

interface ExtendedFormFieldProps extends FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  containerStyle?: any;
}

export const FormField: React.FC<ExtendedFormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  required = false,
  helperText,
  containerStyle,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...rest}
      />
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
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
  helperText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: THEME.SPACING.XS,
    marginLeft: THEME.SPACING.XS,
  },
});