import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setAuthStoreRef } from '@/services/api/authStoreRef';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes authentication system
 * and connects auth store to API client
 */
export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Set auth store reference for API client
    setAuthStoreRef(() => useAuthStore.getState());
    
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Check biometric availability
        await useAuthStore.getState().checkBiometricAvailability();
      } catch (error) {
        console.error('Failed to initialize auth provider:', error);
      }
    };
    
    initAuth();
  }, []);
  
  return <>{children}</>;
}