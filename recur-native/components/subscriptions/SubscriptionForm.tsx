import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { FormField } from '@/components/common/FormField';
import { DatePicker } from '@/components/common/DatePicker';
import { CurrencyPicker } from '@/components/common/CurrencyPicker';
import { Button } from '@/components/ui';
import { THEME, BILLING_CYCLES } from '@/constants/config';
import { useCategories } from '@/hooks/useCategories';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto, 
  Subscription, 
  BillingCycle,
  Category
} from '@/types';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface SubscriptionFormProps {
  initialData?: Subscription;
  onSubmit: (data: CreateSubscriptionDto | UpdateSubscriptionDto) => Promise<void>;
  isLoading: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
}) => {
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  
  // Form state
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    name: '',
    description: '',
    cost: 0,
    currency: 'USD',
    billingCycle: BillingCycle.Monthly,
    nextBillingDate: new Date(),
    categoryId: 0,
  });
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form with initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        cost: initialData.cost,
        currency: initialData.currency,
        billingCycle: initialData.billingCycle,
        nextBillingDate: new Date(initialData.nextBillingDate),
        trialEndDate: initialData.trialEndDate ? new Date(initialData.trialEndDate) : null,
        website: initialData.website || '',
        contactEmail: initialData.contactEmail || '',
        notes: initialData.notes || '',
        categoryId: initialData.category.id,
      });
    }
  }, [initialData]);
  
  // Handle form field changes
  const handleChange = (field: keyof CreateSubscriptionDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.cost <= 0) {
      newErrors.cost = 'Cost must be greater than 0';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Email validation
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }
    
    // Website validation
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(formData);
        router.back();
      } catch {
        Alert.alert(
          'Error',
          'Failed to save subscription. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.back();
  };
  
  // Format cost as number
  const formatCost = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formSection}>
        <FormField
          label="Subscription Name"
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter subscription name"
          error={errors.name}
          required
          autoCapitalize="words"
        />
        
        <FormField
          label="Description"
          value={formData.description || ''}
          onChangeText={(value) => handleChange('description', value)}
          placeholder="Enter description (optional)"
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.formSection}>
        <FormField
          label="Cost"
          value={formData.cost.toString()}
          onChangeText={(value) => handleChange('cost', parseFloat(formatCost(value)) || 0)}
          placeholder="0.00"
          keyboardType="numeric"
          error={errors.cost}
          required
        />
        
        <CurrencyPicker
          label="Currency"
          value={formData.currency}
          onChange={(value) => handleChange('currency', value)}
          required
        />
        
        <View style={styles.pickerContainer}>
          <View style={styles.labelContainer}>
            <FormField
              label="Billing Cycle"
              value=""
              onChangeText={() => {}}
              containerStyle={{ marginBottom: 0 }}
              required
            />
          </View>
          
          <View style={[
            styles.picker,
            Platform.OS === 'ios' && styles.pickerIOS
          ]}>
            <Picker
              selectedValue={formData.billingCycle}
              onValueChange={(value) => handleChange('billingCycle', value)}
              style={{ width: '100%' }}
            >
              {Object.values(BILLING_CYCLES).map((cycle) => (
                <Picker.Item 
                  key={cycle.id} 
                  label={cycle.name} 
                  value={cycle.id} 
                />
              ))}
            </Picker>
          </View>
        </View>
        
        <DatePicker
          label="Next Billing Date"
          value={formData.nextBillingDate}
          onChange={(date) => handleChange('nextBillingDate', date)}
          minimumDate={new Date()}
          required
        />
        
        <DatePicker
          label="Trial End Date"
          value={formData.trialEndDate || new Date()}
          onChange={(date) => handleChange('trialEndDate', date)}
          minimumDate={new Date()}
        />
      </View>
      
      <View style={styles.formSection}>
        <View style={styles.pickerContainer}>
          <View style={styles.labelContainer}>
            <FormField
              label="Category"
              value=""
              onChangeText={() => {}}
              containerStyle={{ marginBottom: 0 }}
              error={errors.categoryId}
              required
            />
          </View>
          
          <View style={[
            styles.picker,
            Platform.OS === 'ios' && styles.pickerIOS,
            errors.categoryId && styles.pickerError
          ]}>
            <Picker
              selectedValue={formData.categoryId}
              onValueChange={(value) => handleChange('categoryId', value)}
              style={{ width: '100%' }}
              enabled={!categoriesLoading}
            >
              <Picker.Item label="Select a category" value={0} />
              {categories?.map((category: Category) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.name} 
                  value={category.id} 
                  color={category.color}
                />
              ))}
            </Picker>
          </View>
          {errors.categoryId && <ErrorMessage message={errors.categoryId} />}
        </View>
      </View>
      
      <View style={styles.formSection}>
        <FormField
          label="Website"
          value={formData.website || ''}
          onChangeText={(value) => handleChange('website', value)}
          placeholder="https://example.com"
          keyboardType="default"
          autoCapitalize="none"
          error={errors.website}
        />
        
        <FormField
          label="Contact Email"
          value={formData.contactEmail || ''}
          onChangeText={(value) => handleChange('contactEmail', value)}
          placeholder="contact@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.contactEmail}
        />
        
        <FormField
          label="Notes"
          value={formData.notes || ''}
          onChangeText={(value) => handleChange('notes', value)}
          placeholder="Add any additional notes here"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={initialData ? "Update" : "Create"}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  contentContainer: {
    padding: THEME.SPACING.MD,
    paddingBottom: THEME.SPACING.XL * 2,
  },
  formSection: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.MD,
    marginBottom: THEME.SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: THEME.SPACING.MD,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.XS,
  },
  picker: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.BORDER_RADIUS.MD,
    backgroundColor: THEME.COLORS.SURFACE,
    marginBottom: THEME.SPACING.XS,
  },
  pickerIOS: {
    paddingHorizontal: THEME.SPACING.SM,
  },
  pickerError: {
    borderColor: THEME.COLORS.ERROR,
    borderWidth: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SPACING.MD,
  },
  cancelButton: {
    flex: 1,
    marginRight: THEME.SPACING.SM,
  },
  submitButton: {
    flex: 1,
    marginLeft: THEME.SPACING.SM,
  },
});