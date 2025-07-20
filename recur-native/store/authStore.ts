import { create } from 'zustand';
import { User, LoginCredentials } from '@/types';
import { authStorage } from '@/services/storage';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
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

      // TODO: This will be implemented in the API service layer task
      // For now, this is a placeholder that shows the expected flow
      
      // const authResponse = await authService.login(credentials);
      // 
      // // Store auth data securely
      // await authStorage.storeAuthData({
      //   token: authResponse.token,
      //   refreshToken: authResponse.refreshToken,
      //   user: authResponse.user,
      //   expiresAt: authResponse.expiresAt.toISOString(),
      // });
      // 
      // setToken(authResponse.token);
      // setUser(authResponse.user);

      console.log('Login called with:', credentials);
      throw new Error('Login implementation pending - will be completed in API service layer task');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  },

  logout: async () => {
    const { setLoading, setError, setUser, setToken } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Clear stored auth data
      await authStorage.clearAuthData();
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // TODO: Call API logout endpoint when implemented
      // await authService.logout();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  },

  checkAuthStatus: async () => {
    const { setLoading, setUser, setToken } = get();
    
    try {
      setLoading(true);
      
      // Check if we have stored auth data
      const authData = await authStorage.getAuthData();
      
      if (authData) {
        setToken(authData.token);
        setUser(authData.user);
        
        // TODO: Validate token with server when API service is implemented
        // const isValid = await authService.validateToken(authData.token);
        // if (!isValid) {
        //   await logout();
        // }
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