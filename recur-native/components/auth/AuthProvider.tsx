import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setAuthStoreRef } from '@/services/api/authStoreRef';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authStore = useAuthStore;
  
  // Initialize auth store reference in API client
  useEffect(() => {
    setAuthStoreRef(authStore);
    
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
  }, [authStore]);

  return <>{children}</>;
};