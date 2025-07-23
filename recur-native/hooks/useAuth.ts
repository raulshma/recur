import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api';
import { LoginCredentials } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

/**
 * Main auth hook that provides authentication functionality
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    clearError: storeClearError,
  } = useAuthStore();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Check if biometrics are available
  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const isBiometricEnabled = await authService.isBiometricEnabled();
      
      const isAvailable = hasHardware && isEnrolled;
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(isAvailable && isBiometricEnabled);
      
      return isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
      return false;
    }
  };

  // Login with email and password
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      // Extract the credentials-like data from the response
      await storeLogin({
        email: credentials.email,
        password: credentials.password,
        ...response
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Login with biometrics
  const loginWithBiometric = async () => {
    try {
      // First authenticate with biometrics
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in with biometrics',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });
      
      if (!biometricResult.success) {
        throw new Error(biometricResult.error || 'Biometric authentication failed');
      }
      
      // Then get token using biometric authentication
      const authResult = await authService.authenticateWithBiometric();
      
      // Login with the token - create a credentials-like object
      await storeLogin({
        email: '', // Biometric login doesn't require email/password
        password: '',
        ...authResult
      });
      
      return { success: true };
    } catch (error) {
      console.error('Biometric login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to authenticate with biometrics'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
      await storeLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout from store even if API call fails
      await storeLogout();
    }
  };

  // Clear error
  const clearError = () => {
    storeClearError();
  };

  // Navigate to biometric setup
  const navigateToBiometricSetup = () => {
    router.push('/auth/biometric-setup');
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    router.replace('/');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    biometricAvailable,
    biometricEnabled,
    login,
    loginWithBiometric,
    logout,
    clearError,
    checkBiometricAvailability,
    navigateToBiometricSetup,
    handleLoginSuccess,
  };
};

/**
 * Hook for checking biometric availability
 */
export const useBiometricStatus = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const checkBiometricAvailability = async () => {
    try {
      // Check if hardware supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Check if biometrics are enabled for this app
      const isBiometricEnabled = await authService.isBiometricEnabled();
      
      // Set state based on checks
      const isAvailable = hasHardware && isEnrolled && supportedTypes.length > 0;
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(isAvailable && isBiometricEnabled);
      
      // Determine biometric type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      } else {
        setBiometricType('Biometric');
      }
      
      return isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
      return false;
    }
  };

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  return {
    biometricAvailable,
    biometricEnabled,
    biometricType,
    checkBiometricAvailability,
  };
};

/**
 * Hook for setting up biometric authentication
 */
export const useBiometricSetup = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        // First verify credentials
        await authService.login(credentials);
        
        // Then set up biometric authentication
        const result = await authService.setupBiometric(credentials);
        
        return { success: true };
      } catch (error) {
        console.error('Biometric setup error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to set up biometric authentication'
        };
      }
    }
  });
};