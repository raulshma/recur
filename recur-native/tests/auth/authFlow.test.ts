import { authService } from '@/services/api';
import { authStorage } from '@/services/storage';
import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, User } from '@/types';

// Mock dependencies
jest.mock('@/services/api', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    validateToken: jest.fn(),
    getCurrentUser: jest.fn(),
    isBiometricAvailable: jest.fn(),
    isBiometricEnabled: jest.fn(),
    setupBiometric: jest.fn(),
    authenticateWithBiometric: jest.fn(),
    disableBiometric: jest.fn(),
  },
}));

jest.mock('@/services/storage', () => ({
  authStorage: {
    storeAuthData: jest.fn(),
    getAuthData: jest.fn(),
    clearAuthData: jest.fn(),
    isTokenExpired: jest.fn(),
    isAuthenticated: jest.fn(),
    updateUserData: jest.fn(),
  },
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Create a mock user that satisfies the User interface
const createMockUser = (overrides = {}): User => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  currency: 'USD',
  createdAt: new Date(),
  roles: ['user'],
  ...overrides
});

describe('Authentication Flow', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      biometricEnabled: false,
      biometricAvailable: false,
    });
  });

  test('Login flow should authenticate user and store data', async () => {
    // Mock data
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    const mockAuthResponse = {
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: createMockUser(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };

    // Setup mocks
    (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

    // Get auth store actions
    const { login } = useAuthStore.getState();

    // Execute login
    await login(credentials);

    // Verify API was called with credentials
    expect(authService.login).toHaveBeenCalledWith(credentials);

    // Verify auth data was stored
    expect(authStorage.storeAuthData).toHaveBeenCalledWith({
      token: mockAuthResponse.token,
      refreshToken: mockAuthResponse.refreshToken,
      user: mockAuthResponse.user,
      expiresAt: mockAuthResponse.expiresAt.toISOString(),
    });

    // Verify state was updated
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockAuthResponse.user);
    expect(state.token).toEqual(mockAuthResponse.token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBeNull();
  });

  test('Logout flow should clear auth data', async () => {
    // Setup initial authenticated state
    useAuthStore.setState({
      user: createMockUser(),
      token: 'mock-token',
      isAuthenticated: true,
    });

    // Get auth store actions
    const { logout } = useAuthStore.getState();

    // Execute logout
    await logout();

    // Verify API was called
    expect(authService.logout).toHaveBeenCalled();

    // Verify auth data was cleared
    expect(authStorage.clearAuthData).toHaveBeenCalled();

    // Verify state was updated
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  test('Token refresh should update token', async () => {
    // Mock data
    const mockNewToken = 'new-mock-token';

    // Setup mocks
    (authService.refreshToken as jest.Mock).mockResolvedValue(mockNewToken);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(createMockUser());

    // Setup initial authenticated state
    useAuthStore.setState({
      user: createMockUser(),
      token: 'old-mock-token',
      isAuthenticated: true,
    });

    // Get auth store actions
    const { refreshToken } = useAuthStore.getState();

    // Execute token refresh
    await refreshToken();

    // Verify API was called
    expect(authService.refreshToken).toHaveBeenCalled();

    // Verify state was updated
    const state = useAuthStore.getState();
    expect(state.token).toEqual(mockNewToken);
    expect(state.isAuthenticated).toBe(true);
  });

  test('Check auth status should restore session', async () => {
    // Mock data
    const mockAuthData = {
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: createMockUser(),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    // Setup mocks
    (authStorage.getAuthData as jest.Mock).mockResolvedValue(mockAuthData);
    (authService.validateToken as jest.Mock).mockResolvedValue(true);

    // Get auth store actions
    const { checkAuthStatus } = useAuthStore.getState();

    // Execute check auth status
    await checkAuthStatus();

    // Verify storage was checked
    expect(authStorage.getAuthData).toHaveBeenCalled();

    // Verify token was validated
    expect(authService.validateToken).toHaveBeenCalledWith(mockAuthData.token);

    // Verify state was updated
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockAuthData.user);
    expect(state.token).toEqual(mockAuthData.token);
    expect(state.isAuthenticated).toBe(true);
  });

  test('Expired token should trigger refresh', async () => {
    // Mock data
    const mockAuthData = {
      token: 'expired-mock-token',
      refreshToken: 'mock-refresh-token',
      user: createMockUser(),
      expiresAt: new Date(Date.now() - 3600 * 1000).toISOString(), // Expired
    };

    const mockNewToken = 'new-mock-token';
    const mockUser = createMockUser({ name: 'Updated User' });

    // Setup mocks
    (authStorage.getAuthData as jest.Mock).mockResolvedValue(mockAuthData);
    (authService.validateToken as jest.Mock).mockResolvedValue(false); // Token is invalid
    (authService.refreshToken as jest.Mock).mockResolvedValue(mockNewToken);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Get auth store actions
    const { checkAuthStatus } = useAuthStore.getState();

    // Execute check auth status
    await checkAuthStatus();

    // Verify token was validated
    expect(authService.validateToken).toHaveBeenCalledWith(mockAuthData.token);

    // Verify token was refreshed
    expect(authService.refreshToken).toHaveBeenCalled();

    // Verify user data was fetched
    expect(authService.getCurrentUser).toHaveBeenCalled();

    // Verify state was updated
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toEqual(mockNewToken);
    expect(state.isAuthenticated).toBe(true);
  });
});