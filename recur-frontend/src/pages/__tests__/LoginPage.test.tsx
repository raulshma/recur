import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import * as authApi from '../../api/auth';

// Mock the auth API
vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    isAuthenticated: vi.fn(),
    getStoredUser: vi.fn(),
    getCurrentUser: vi.fn(),
    getStoredToken: vi.fn(),
    storeAuthData: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(authApi.authApi.isAuthenticated).mockReturnValue(false);
    vi.mocked(authApi.authApi.getStoredUser).mockReturnValue(null);
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders the login form', () => {
    renderLoginPage();
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check for validation errors
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    
    // Enter invalid email
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check for validation error
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    // Mock successful login
    vi.mocked(authApi.authApi.login).mockResolvedValue({
      success: true,
      message: 'Login successful',
      token: 'fake-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        currency: 'USD',
        createdAt: new Date().toISOString(),
      },
    });
    
    renderLoginPage();
    const user = userEvent.setup();
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByLabelText(/remember me/i));
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(authApi.authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        rememberMe: true,
      });
    });
    
    // Verify navigation after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on login failure', async () => {
    // Mock failed login
    vi.mocked(authApi.authApi.login).mockRejectedValue({
      message: 'Invalid email or password',
    });
    
    renderLoginPage();
    const user = userEvent.setup();
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify error message is displayed
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    
    // Verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from login page', async () => {
    // Mock authenticated user
    vi.mocked(authApi.authApi.isAuthenticated).mockReturnValue(true);
    vi.mocked(authApi.authApi.getStoredUser).mockReturnValue({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD',
      createdAt: new Date().toISOString(),
    });
    
    renderLoginPage();
    
    // Verify redirect happens
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});