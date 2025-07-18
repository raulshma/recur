import React, { useState, useId, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest } from '../types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../components/auth';
import AuthHeader from '../components/auth/AuthHeader';
import FormError from '../components/auth/FormError';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Checkbox } from '../components/ui/checkbox';
import {
  Card,
  CardHeader,
  CardContent,
} from '../components/ui/card';
import { useFocusManagement, useFocusTrap } from '../hooks/useFocusManagement';
import { handleAuthError } from '../utils/auth-utils';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

// Define the login form schema using Zod
const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().default(false),
});

// Type for the form values derived from the schema
type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Redirect authenticated users away from login page
  useAuthRedirect({ redirectAuthenticated: true });
  
  // Generate unique IDs for form elements
  const formId = useId();
  const emailErrorId = `${formId}-email-error`;
  const passwordErrorId = `${formId}-password-error`;
  const authErrorId = `${formId}-auth-error`;

  // Initialize React Hook Form with Zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  // Focus management
  const authErrorRef = useRef<HTMLDivElement>(null);
  const formRef = useFocusTrap<HTMLFormElement>(true);
  
  // Set initial focus on email input
  const emailInputRef = useFocusManagement<HTMLInputElement>(true, []);

  // Handle form submission
  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    
    try {
      // Convert form values to LoginRequest type
      const loginData: LoginRequest = {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      };
      
      // Pass the rememberMe flag to the login function
      await login(loginData);
      
      // On successful login, navigate to the dashboard
      navigate('/dashboard');
      
      // Note: The backend should handle the rememberMe flag by:
      // 1. Setting a longer expiration time for the JWT token
      // 2. Storing the token in localStorage (already implemented)
      // 3. Using the token to authenticate the user on subsequent requests (already implemented)
    } catch (err) {
      // Use our utility function to handle authentication errors
      handleAuthError(err, setAuthError, authErrorRef as React.RefObject<HTMLElement>);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-2">
          <AuthHeader 
            title="Sign in to your account"
            subtitle="Or"
            linkText="create a new account"
            linkUrl="/register"
          />
        </CardHeader>
        
        <CardContent>
          {authError && (
            <div ref={authErrorRef} tabIndex={-1}>
              <FormError 
                id={authErrorId} 
                message={authError} 
                className="mb-6" 
              />
            </div>
          )}
          
          <Form {...form}>
            <form 
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-4"
              aria-label="Login form"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${formId}-email`}>Email address</FormLabel>
                    <FormControl>
                      <Input 
                        ref={emailInputRef}
                        id={`${formId}-email`}
                        placeholder="Enter your email" 
                        type="email"
                        autoComplete="email"
                        className="sm:text-sm"
                        aria-required="true"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? emailErrorId : undefined}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage id={emailErrorId} />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${formId}-password`}>Password</FormLabel>
                    <FormControl>
                      <Input 
                        id={`${formId}-password`}
                        placeholder="Enter your password" 
                        type="password"
                        autoComplete="current-password"
                        className="sm:text-sm"
                        aria-required="true"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? passwordErrorId : undefined}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage id={passwordErrorId} />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => {
                    const checkboxId = `${formId}-remember-me`;
                    return (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            id={checkboxId}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Remember me"
                          />
                        </FormControl>
                        <FormLabel 
                          htmlFor={checkboxId} 
                          className="text-sm font-medium"
                        >
                          Remember me
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
                
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
                  aria-label="Forgot your password? Reset it here"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loading}
                aria-label="Sign in to your account"
                aria-busy={loading}
              >
                {loading ? <LoadingSpinner size="sm" className="mr-2" aria-hidden="true" /> : null}
                Sign in
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
                    aria-label="Register for a new account"
                  >
                    Register now
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export { LoginPage };
export default LoginPage;