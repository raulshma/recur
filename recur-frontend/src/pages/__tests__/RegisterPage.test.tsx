import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import RegisterPage from "../RegisterPage";
import * as authApi from '../../api/auth';

// Mock the auth API
vi.mock('../../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    isAuthenticated: vi.fn(),
    getStoredUser: vi.fn(),
    getCurrentUser: vi.fn(),
    getStoredToken: vi.fn(),
    storeAuthData: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the auth context
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    register: vi.fn().mockImplementation((data) => {
      if (data.email === "error@example.com") {
        return Promise.reject(new Error("Registration failed"));
      }
      return Promise.resolve();
    }),
    loading: false,
    isAuthenticated: false,
  }),
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

// Mock the components
vi.mock("../../components/auth/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

vi.mock("../../components/auth/AuthHeader", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="auth-header">{title}</div>
  ),
}));

vi.mock("../../components/auth/FormError", () => ({
  __esModule: true,
  default: ({ message }: { message: string }) =>
    message ? <div data-testid="form-error">{message}</div> : null,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(authApi.authApi.isAuthenticated).mockReturnValue(false);
    vi.mocked(authApi.authApi.getStoredUser).mockReturnValue(null);
  });
  
  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  test("renders the registration form", () => {
    renderRegisterPage();

    expect(screen.getByTestId("auth-header")).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  test("validates form inputs", async () => {
    renderRegisterPage();

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });

    // Fill in an invalid email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid-email" },
    });

    // Check for email validation error
    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    // Fill in non-matching passwords
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password456" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Check for password matching error
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  test("validates password requirements", async () => {
    renderRegisterPage();

    // Fill in a password without uppercase letter
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });

    // Fill in a password without lowercase letter
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "PASSWORD123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });

    // Fill in a password without number
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "PasswordTest" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
    });
  });

  test("submits the form with valid data", async () => {
    renderRegisterPage();

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "john.doe@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Wait for the form submission to complete
    await waitFor(() => {
      // No error message should be displayed
      expect(screen.queryByTestId("form-error")).not.toBeInTheDocument();
    });
  });

  test("displays error message on failed registration", async () => {
    renderRegisterPage();

    // Fill in form data that will trigger an error
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Error" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "User" },
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "error@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toBeInTheDocument();
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  test("navigation links work correctly", () => {
    renderRegisterPage();

    // Check that the sign in link points to the correct URL
    const signInLink = screen.getByText(/sign in/i);
    expect(signInLink.closest("a")).toHaveAttribute("href", "/login");
  });
});

  test("redirects authenticated users away from register page", async () => {
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
    
    renderRegisterPage();
    
    // Verify redirect happens
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test("navigates to dashboard after successful registration", async () => {
    // Override the mock to simulate successful registration
    const useAuthMock = vi.spyOn(require("../../context/AuthContext"), "useAuth");
    useAuthMock.mockReturnValue({
      register: vi.fn().mockResolvedValue({}),
      loading: false,
      isAuthenticated: false,
    });
    
    renderRegisterPage();

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "john.doe@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password123" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Wait for navigation to occur
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });