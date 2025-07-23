import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { THEME, VALIDATION } from '@/constants/config';
import { LoginCredentials } from '@/types';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string | undefined;
  password?: string | undefined;
  general?: string | undefined;
}

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { 
    login, 
    loginWithBiometric, 
    error: authError, 
    clearError, 
    isLoading, 
    biometricEnabled, 
    biometricAvailable,
    handleLoginSuccess,
    navigateToBiometricSetup
  } = useAuth();

  // Set error from auth store if present
  useEffect(() => {
    if (authError) {
      setErrors({ general: authError });
      clearError();
    }
  }, [authError, clearError]);

  // Clear general error when user starts typing
  useEffect(() => {
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  }, [formData.email, formData.password]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const credentials: LoginCredentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      };

      await login(credentials);
      handleLoginSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors({ general: errorMessage });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric();
      handleLoginSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Biometric login failed';
      Alert.alert('Biometric Login Failed', errorMessage);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Recur account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholder="Enter your password"
            secureTextEntry={true}
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, formData.rememberMe && styles.checkboxChecked]}>
                {formData.rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            size="large"
          />

          {biometricAvailable && (
            <View style={styles.biometricSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {biometricEnabled ? (
                <Button
                  title="Use Biometric Login"
                  onPress={handleBiometricLogin}
                  variant="outline"
                  size="large"
                  loading={isLoading}
                  disabled={isLoading}
                  icon="👆"
                />
              ) : (
                <Button
                  title="Set Up Biometric Login"
                  onPress={navigateToBiometricSetup}
                  variant="ghost"
                  size="large"
                  disabled={isLoading}
                  icon="🔒"
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.signUpText}>Contact your administrator</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME.SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.SPACING.XXL,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  form: {
    marginBottom: THEME.SPACING.XL,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.LG,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: 4,
    marginRight: THEME.SPACING.SM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.SURFACE,
  },
  checkboxChecked: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderColor: THEME.COLORS.PRIMARY,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  forgotPasswordText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: THEME.COLORS.ERROR,
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.MD,
    marginBottom: THEME.SPACING.LG,
  },
  errorText: {
    color: THEME.COLORS.ERROR,
    fontSize: THEME.FONT_SIZES.SM,
    textAlign: 'center',
  },
  biometricSection: {
    marginTop: THEME.SPACING.LG,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.SPACING.LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.COLORS.BORDER,
  },
  dividerText: {
    marginHorizontal: THEME.SPACING.MD,
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  footer: {
    alignItems: 'center',
    marginTop: THEME.SPACING.XL,
  },
  footerText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  signUpText: {
    color: THEME.COLORS.PRIMARY,
    fontWeight: '600',
  },
});