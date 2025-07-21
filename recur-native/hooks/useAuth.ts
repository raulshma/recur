import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService, BiometricAuthResult } from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { LoginCredentials, UpdateProfileDto, ChangePasswordDto } from '@/types';
import { useEffect } from 'react';

// Hook for login functionality
export const useLogin = () => {
  const login = useAuthStore(state => state.login);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

// Hook for biometric login functionality
export const useBiometricLogin = () => {
  const loginWithBiometric = useAuthStore(state => state.loginWithBiometric);

  return useMutation({
    mutationFn: () => loginWithBiometric(),
    onError: (error) => {
      console.error('Biometric login failed:', error);
    },
  });
};

// Hook for logout functionality
export const useLogout = () => {
  const logout = useAuthStore(state => state.logout);

  return useMutation({
    mutationFn: () => logout(),
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });
};

// Hook for fetching current user
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    initialData: user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for updating user profile
export const useUpdateProfile = () => {
  const updateUser = useAuthStore(state => state.updateUser);

  return useMutation({
    mutationFn: (profile: UpdateProfileDto) => authService.updateProfile(profile),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
};

// Hook for changing password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwords: ChangePasswordDto) => authService.changePassword(passwords),
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
};

// Hook for biometric setup
export const useBiometricSetup = () => {
  const setupBiometric = useAuthStore(state => state.setupBiometric);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => setupBiometric(credentials),
    onError: (error) => {
      console.error('Biometric setup failed:', error);
    },
  });
};

// Hook for disabling biometric authentication
export const useDisableBiometric = () => {
  const disableBiometric = useAuthStore(state => state.disableBiometric);

  return useMutation({
    mutationFn: () => disableBiometric(),
    onError: (error) => {
      console.error('Failed to disable biometric:', error);
    },
  });
};

// Hook for token refresh
export const useTokenRefresh = () => {
  const refreshToken = useAuthStore(state => state.refreshToken);
  const isRefreshingToken = useAuthStore(state => state.isRefreshingToken);

  const mutation = useMutation({
    mutationFn: () => refreshToken(),
    onError: (error) => {
      console.error('Token refresh failed:', error);
    },
  });

  return {
    ...mutation,
    isRefreshing: isRefreshingToken,
  };
};

// Hook for biometric availability and status
export const useBiometricStatus = () => {
  const { biometricEnabled, biometricAvailable } = useAuthStore();
  const checkBiometricAvailability = useAuthStore(state => state.checkBiometricAvailability);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  return {
    biometricEnabled,
    biometricAvailable,
    checkBiometricAvailability,
  };
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    biometricEnabled, 
    biometricAvailable,
    isRefreshingToken 
  } = useAuthStore();
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    biometricEnabled,
    biometricAvailable,
    isRefreshingToken,
    checkAuthStatus,
  };
};

// Hook for automatic authentication initialization
export const useAuthInitialization = () => {
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const { isLoading } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return { isInitializing: isLoading };
};