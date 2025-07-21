import { create } from 'zustand';
import { User, LoginCredentials } from '@/types';
import { authStorage, secureStorage } from '@/services/storage';
import { authService, BiometricAuthResult } from '@/services/api';
import { STORAGE_KEYS } from '@/constants/config';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  isRefreshingToken: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setBiometricAvailable: (available: boolean) => void;
  setRefreshingToken: (refreshing: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setupBiometric: (credentials: LoginCredentials) => Promise<BiometricAuthResult>;
  disableBiometric: () => Promise<void>;
  checkBiometricAvailability: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  biometricAvailable: false,
  isRefreshingToken: false,

  // Actions
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: user !== null 
    });
  },

  setToken: (token) => {
    set({ token });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  setBiometricEnabled: (biometricEnabled) => {
    set({ biometricEnabled });
  },

  setBiometricAvailable: (biometricAvailable) => {
    set({ biometricAvailable });
  },

  setRefreshingToken: (isRefreshingToken) => {
    set({ isRefreshingToken });
  },

  clearError: () => {
    set({ error: null });
  },

  updateUser: (user) => {
    set({ user });
    // Update stored user data
    authStorage.updateUserData(user).catch(error => {
      console.error('Failed to update stored user data:', error);
    });
  },

  login: async (credentials) => {
    const { setLoading, setError, setUser, setToken } = get();
    
    try {
      setLoading(true);
      setError(null);

      const authResponse = await authService.login(credentials);
      
      // Store auth data securely
      await authStorage.storeAuthData({
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        user: authResponse.user,
        expiresAt: authResponse.expiresAt.toISOString(),
      });
      
      setToken(authResponse.token);
      setUser(authResponse.user);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  },

  loginWithBiometric: async () => {
    const { setLoading, setError, setUser, setToken } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Authenticate with biometric
      const biometricResult = await authService.authenticateWithBiometric();
      if (!biometricResult.success) {
        throw new Error(biometricResult.error || 'Biometric authentication failed');
      }

      // Get stored credentials
      const credentials = await authService.getBiometricCredentials();
      if (!credentials) {
        throw new Error('No stored credentials found for biometric login');
      }

      // Login with stored credentials
      const authResponse = await authService.login(credentials);
      
      // Store auth data securely
      await authStorage.storeAuthData({
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        user: authResponse.user,
        expiresAt: authResponse.expiresAt.toISOString(),
      });
      
      setToken(authResponse.token);
      setUser(authResponse.user);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Biometric login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  },

  logout: async () => {
    const { setLoading, setError, setUser, setToken, setBiometricEnabled } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Call API logout endpoint
      await authService.logout();
      
      // Clear stored auth data
      await authStorage.clearAuthData();
      
      // Clear state
      setToken(null);
      setUser(null);
      setBiometricEnabled(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  },

  refreshToken: async () => {
    const { setRefreshingToken, setToken, setUser, setError } = get();
    
    try {
      setRefreshingToken(true);
      setError(null);

      const newToken = await authService.refreshToken();
      setToken(newToken);
      
      // Optionally refresh user data
      try {
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch (userError) {
        console.warn('Failed to refresh user data:', userError);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      setError(errorMessage);
      
      // Clear auth data on refresh failure
      await authStorage.clearAuthData();
      setToken(null);
      setUser(null);
      
      throw error;
    } finally {
      setRefreshingToken(false);
    }
  },

  setupBiometric: async (credentials) => {
    const { setBiometricEnabled } = get();
    
    try {
      const result = await authService.setupBiometric(credentials);
      
      if (result.success) {
        setBiometricEnabled(true);
      }
      
      return result;
    } catch (error) {
      console.error('Error setting up biometric:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup biometric authentication',
      };
    }
  },

  disableBiometric: async () => {
    const { setBiometricEnabled } = get();
    
    try {
      await authService.disableBiometric();
      setBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  },

  checkBiometricAvailability: async () => {
    const { setBiometricAvailable, setBiometricEnabled } = get();
    
    try {
      const isAvailable = await authService.isBiometricAvailable();
      const isEnabled = await authService.isBiometricEnabled();
      
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(isEnabled && isAvailable);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
    }
  },

  checkAuthStatus: async () => {
    const { setLoading, setUser, setToken, checkBiometricAvailability } = get();
    
    try {
      setLoading(true);
      
      // Check biometric availability
      await checkBiometricAvailability();
      
      // Check if we have stored auth data
      const authData = await authStorage.getAuthData();
      
      if (authData) {
        // Validate token with server
        const isValid = await authService.validateToken(authData.token);
        if (isValid) {
          setToken(authData.token);
          setUser(authData.user);
        } else {
          // Try to refresh token
          try {
            const newToken = await authService.refreshToken();
            setToken(newToken);
            
            // Get updated user data
            const user = await authService.getCurrentUser();
            setUser(user);
          } catch (refreshError) {
            // Token refresh failed, clear auth data
            await authStorage.clearAuthData();
            setToken(null);
            setUser(null);
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // Clear potentially corrupted auth data
      await authStorage.clearAuthData();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  },
}));