import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '@/constants/config';
import { FormField } from '@/components/common/FormField';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { useRouter } from 'expo-router';
import { ColorPicker } from './ColorPicker';

interface CategoryFormProps {
  initialData?: Category;
  isEdit?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    color: THEME.COLORS.PRIMARY,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        color: initialData.color,
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (field: keyof CreateCategoryDto, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEdit && initialData) {
        // Check if it's a default category
        if (initialData.isDefault) {
          Alert.alert(
            'Cannot Modify Default Category',
            'Default categories cannot be modified.',
            [{ text: 'OK' }]
          );
          setIsSubmitting(false);
          return;
        }

        await updateCategory.mutateAsync({
          id: initialData.id,
          data: formData as UpdateCategoryDto,
        });
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await createCategory.mutateAsync(formData);
        Alert.alert('Success', 'Category created successfully');
      }
      router.back();
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <FormField
          label="Category Name"
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter category name"
          error={errors.name}
          required
          autoCapitalize="words"
          editable={!(isEdit && initialData?.isDefault)}
        />

        <FormField
          label="Description"
          value={formData.description || ''}
          onChangeText={(value) => handleChange('description', value)}
          placeholder="Enter category description (optional)"
          multiline
          numberOfLines={3}
          editable={!(isEdit && initialData?.isDefault)}
        />

        <View style={styles.colorSection}>
          <Text style={styles.label}>
            Category Color <Text style={styles.required}>*</Text>
          </Text>
          <ColorPicker
            selectedColor={formData.color}
            onSelectColor={(color) => handleChange('color', color)}
            disabled={!!(isEdit && initialData?.isDefault)}
          />
          {errors.color && <ErrorMessage message={errors.color} />}
        </View>

        {isEdit && initialData?.isDefault && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Default categories cannot be modified.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (isSubmitting || (isEdit && initialData?.isDefault)) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || (isEdit && initialData?.isDefault)}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Category' : 'Create Category'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  formContainer: {
    padding: THEME.SPACING.LG,
  },
  label: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.XS,
  },
  required: {
    color: THEME.COLORS.ERROR,
  },
  colorSection: {
    marginBottom: THEME.SPACING.LG,
  },
  warningContainer: {
    backgroundColor: THEME.COLORS.WARNING_LIGHT,
    padding: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginBottom: THEME.SPACING.LG,
  },
  warningText: {
    color: THEME.COLORS.WARNING,
    fontSize: THEME.FONT_SIZES.SM,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SPACING.LG,
  },
  button: {
    flex: 1,
    paddingVertical: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    marginRight: THEME.SPACING.MD,
  },
  cancelButtonText: {
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: THEME.FONT_SIZES.MD,
  },
  submitButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: THEME.FONT_SIZES.MD,
  },
  disabledButton: {
    opacity: 0.5,
  },
});