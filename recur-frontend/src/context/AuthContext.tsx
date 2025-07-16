import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const storedUser = authApi.getStoredUser();
          if (storedUser) {
            // Set stored user first for immediate display
            setUser(storedUser);
            try {
              // Verify token is still valid by fetching current user
              const currentUser = await authApi.getCurrentUser();
              // Update with fresh data from server
              setUser(currentUser);
              // Update stored data with fresh data
              const token = authApi.getStoredToken();
              if (token) {
                authApi.storeAuthData(token, currentUser);
              }
            } catch (error) {
              // If API call fails but we have stored user, keep using stored user
              console.warn('Failed to fetch current user, using stored data:', error);
            }
          }
        }
      } catch (error) {
        // Token is invalid, clear stored data
        authApi.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.success && response.token && response.user) {
        authApi.storeAuthData(response.token, response.user);
        setUser(response.user);
      } else {
        throw new Error(response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.success && response.token && response.user) {
        authApi.storeAuthData(response.token, response.user);
        setUser(response.user);
      } else {
        throw new Error(response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    console.log('AuthContext: Updating user with:', updatedUser);
    setUser(updatedUser);
    // Update stored user data as well
    const token = authApi.getStoredToken();
    if (token) {
      authApi.storeAuthData(token, updatedUser);
      console.log('AuthContext: Stored updated user data');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 