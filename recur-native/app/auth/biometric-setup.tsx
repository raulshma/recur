import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useBiometricSetup, useBiometricStatus } from '@/hooks/useAuth';
import { THEME, VALIDATION } from '@/constants/config';
import { LoginCredentials } from '@/types';

interface BiometricSetupFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string | undefined;
  password?: string | undefined;
  general?: string | undefined;
}

export default function BiometricSetupScreen() {
  const [formData, setFormData] = useState<BiometricSetupFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [biometricTypes, setBiometricTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(true);

  const biometricSetupMutation = useBiometricSetup();
  const { biometricAvailable, checkBiometricAvailability } = useBiometricStatus();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      setIsCheckingBiometric(true);
      
      // Check if biometric hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (!hasHardware) {
        Alert.alert(
          'Biometric Not Available',
          'This device does not support biometric authentication.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      if (!isEnrolled) {
        Alert.alert(
          'Biometric Not Set Up',
          'Please set up biometric authentication in your device settings first.',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Settings', onPress: () => {
              // On iOS, this would open Settings app
              // On Android, this would open Security settings
              Alert.alert('Please go to Settings > Security to set up biometric authentication');
            }}
          ]
        );
        return;
      }

      setBiometricTypes(supportedTypes);
      await checkBiometricAvailability();
    } catch (error) {
      console.error('Error checking biometric support:', error);
      Alert.alert(
        'Error',
        'Failed to check biometric support. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsCheckingBiometric(false);
    }
  };

  const getBiometricTypeText = (): string => {
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (biometricTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    } else {
      return 'Biometric Authentication';
    }
  };

  const getBiometricIcon = (): string => {
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '👤';
    } else if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '👆';
    } else if (biometricTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '👁️';
    } else {
      return '🔒';
    }
  };

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

  const handleInputChange = (field: keyof BiometricSetupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSetupBiometric = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const credentials: LoginCredentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const result = await biometricSetupMutation.mutateAsync(credentials);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `${getBiometricTypeText()} has been set up successfully. You can now use it to sign in to Recur.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      } else {
        setErrors({ general: result.error || 'Failed to set up biometric authentication' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup failed. Please try again.';
      setErrors({ general: errorMessage });
    }
  };

  const handleSkipSetup = () => {
    Alert.alert(
      'Skip Biometric Setup',
      'You can set up biometric authentication later in your profile settings.',
      [
        { text: 'Cancel' },
        { text: 'Skip', onPress: () => router.replace('/auth/login') }
      ]
    );
  };

  if (isCheckingBiometric) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking biometric support...</Text>
      </View>
    );
  }

  if (!biometricAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Biometric Not Available</Text>
          <Text style={styles.errorMessage}>
            Biometric authentication is not available on this device or not set up in device settings.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{getBiometricIcon()}</Text>
        <Text style={styles.title}>Set Up {getBiometricTypeText()}</Text>
        <Text style={styles.subtitle}>
          Use {getBiometricTypeText().toLowerCase()} to quickly and securely sign in to your Recur account.
        </Text>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>⚡</Text>
          <Text style={styles.benefitText}>Quick and convenient sign-in</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔒</Text>
          <Text style={styles.benefitText}>Enhanced security</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🚫</Text>
          <Text style={styles.benefitText}>No need to remember passwords</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Verify Your Credentials</Text>
        <Text style={styles.formSubtitle}>
          Please enter your login credentials to set up {getBiometricTypeText().toLowerCase()}.
        </Text>

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

        {errors.general && (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessageText}>{errors.general}</Text>
          </View>
        )}

        <Button
          title={`Set Up ${getBiometricTypeText()}`}
          onPress={handleSetupBiometric}
          loading={biometricSetupMutation.isPending}
          disabled={biometricSetupMutation.isPending}
          size="large"
          icon={getBiometricIcon()}
        />

        <Button
          title="Skip for Now"
          onPress={handleSkipSetup}
          variant="ghost"
          size="large"
          disabled={biometricSetupMutation.isPending}
        />
      </View>

      <View style={styles.securityNote}>
        <Text style={styles.securityNoteIcon}>🛡️</Text>
        <Text style={styles.securityNoteText}>
          Your biometric data is stored securely on your device and never shared with Recur or any third parties.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    padding: THEME.SPACING.LG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  loadingText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.SPACING.XL,
  },
  icon: {
    fontSize: 64,
    marginBottom: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.LG,
    marginBottom: THEME.SPACING.XL,
  },
  benefitsTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.SM,
  },
  benefitIcon: {
    fontSize: THEME.FONT_SIZES.LG,
    marginRight: THEME.SPACING.MD,
  },
  benefitText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  form: {
    marginBottom: THEME.SPACING.XL,
  },
  formTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  formSubtitle: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SPACING.LG,
    lineHeight: 20,
  },
  errorMessageContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: THEME.COLORS.ERROR,
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.MD,
    marginBottom: THEME.SPACING.LG,
  },
  errorMessageText: {
    color: THEME.COLORS.ERROR,
    fontSize: THEME.FONT_SIZES.SM,
    textAlign: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.MD,
  },
  securityNoteIcon: {
    fontSize: THEME.FONT_SIZES.LG,
    marginRight: THEME.SPACING.SM,
  },
  securityNoteText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.LG,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: THEME.SPACING.MD,
  },
  errorTitle: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.SPACING.XL,
  },
});