import { api } from './client';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  LoginCredentials,
  AuthResponse,
  User,
  UpdateProfileDto,
  ChangePasswordDto,
} from '@/types';
import { authStorage, secureStorage } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/config';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType[];
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  getCurrentUser(): Promise<User>;
  updateProfile(profile: UpdateProfileDto): Promise<User>;
  changePassword(passwords: ChangePasswordDto): Promise<void>;
  validateToken(token: string): Promise<boolean>;
  // Biometric authentication methods
  isBiometricAvailable(): Promise<boolean>;
  getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]>;
  setupBiometric(credentials: LoginCredentials): Promise<BiometricAuthResult>;
  authenticateWithBiometric(): Promise<BiometricAuthResult>;
  disableBiometric(): Promise<void>;
  isBiometricEnabled(): Promise<boolean>;
}

class AuthServiceImpl implements AuthService {
  private tokenRefreshPromise: Promise<string> | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{
      token: string;
      expires: string;
      user: User;
      refreshToken?: string;
    }>('/auth/login', credentials);
    
    // Transform the API response to match our AuthResponse interface
    return {
      token: response.token,
      refreshToken: response.refreshToken || '', // Provide empty string if not present
      user: response.user,
      expiresAt: new Date(response.expires), // Convert string to Date
    };
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.tokenRefreshPromise;
      return newToken;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });

      const { token, refreshToken: newRefreshToken } = response;

      // Update stored tokens
      await Promise.all([
        secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
      ]);

      return token;
    } catch (error) {
      // Clear invalid tokens
      await authStorage.clearAuthData();
      throw new Error('Token refresh failed');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response;
  }

  async updateProfile(profile: UpdateProfileDto): Promise<User> {
    const response = await api.put<User>('/auth/profile', profile);
    return response;
  }

  async changePassword(passwords: ChangePasswordDto): Promise<void> {
    await api.post('/auth/change-password', passwords);
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Biometric Authentication Methods
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  async setupBiometric(credentials: LoginCredentials): Promise<BiometricAuthResult> {
    try {
      // First check if biometric is available
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Authenticate with biometric to confirm setup
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Set up biometric authentication for Recur',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (!biometricResult.success) {
        return {
          success: false,
          error: biometricResult.error || 'Biometric authentication failed',
        };
      }

      // Store encrypted credentials for biometric login
      const credentialsJson = JSON.stringify(credentials);
      await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      await secureStorage.setItem('biometric_credentials', credentialsJson);

      const biometricTypes = await this.getBiometricTypes();
      
      return {
        success: true,
        biometricType: biometricTypes,
      };
    } catch (error) {
      console.error('Error setting up biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup biometric authentication',
      };
    }
  }

  async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
        };
      }

      const biometricTypes = await this.getBiometricTypes();
      const biometricTypeText = this.getBiometricTypeText(biometricTypes);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Use ${biometricTypeText} to sign in to Recur`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        return {
          success: true,
          biometricType: biometricTypes,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
        };
      }
    } catch (error) {
      console.error('Error with biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed',
      };
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        secureStorage.removeItem('biometric_credentials'),
      ]);
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const isEnabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return isEnabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  private getBiometricTypeText(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    } else {
      return 'biometric authentication';
    }
  }

  // Helper method to get stored biometric credentials
  async getBiometricCredentials(): Promise<LoginCredentials | null> {
    try {
      const credentialsJson = await secureStorage.getItem('biometric_credentials');
      if (!credentialsJson) {
        return null;
      }
      return JSON.parse(credentialsJson) as LoginCredentials;
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return null;
    }
  }
}

export const authService = new AuthServiceImpl();