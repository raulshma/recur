import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginPage } from '../../../pages/LoginPage';
import { RegisterPage } from '../../../pages/RegisterPage';
import { AuthProvider } from '../../../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock the AuthContext provider
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    register: jest.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Screen Reader Accessibility Tests', () => {
  test('LoginPage should have no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Run axe on the rendered component
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    
    // Check for proper form labeling
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    
    // Check for proper button labeling
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for proper link labeling
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });
  
  test('RegisterPage should have no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Run axe on the rendered component
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    
    // Check for proper form labeling
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    
    // Check for proper button labeling
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    
    // Check for proper link labeling
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
  
  test('Form errors should be properly associated with form fields', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Get the email input
    const emailInput = screen.getByLabelText(/email address/i);
    
    // Check that the input has the correct aria attributes
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    
    // When there's an error, the input should have aria-invalid="true"
    // and aria-describedby pointing to the error message
    // This would typically be tested with user events to trigger validation
  });
});