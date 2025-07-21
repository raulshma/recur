import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setAuthStoreRef } from '@/services/api/client';
import { useAuthInitialization } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authStore = useAuthStore;
  
  // Initialize auth store reference in API client
  useEffect(() => {
    setAuthStoreRef(authStore);
  }, [authStore]);

  // Initialize authentication status
  useAuthInitialization();

  return <>{children}</>;
};