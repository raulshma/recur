import React, { useState, useId, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RegisterRequest, CreateInviteRequestByUser } from '../types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../components/auth';
import AuthHeader from '../components/auth/AuthHeader';
import FormError from '../components/auth/FormError';
import InviteRequestForm from '../components/auth/InviteRequestForm';
import { authApi } from '../api/auth';
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
import {
  Card,
  CardHeader,
  CardContent,
} from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useFocusManagement, useFocusTrap } from '../hooks/useFocusManagement';
import { handleAuthError } from '../utils/auth-utils';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

// Define available currencies
const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
];

// Define the registration form schema using Zod
const registerFormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
  currency: z
    .string()
    .min(1, { message: 'Currency is required' }),
  inviteToken: z
    .string()
    .min(1, { message: 'Valid invitation required' }),
})
// Add password matching validation
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type for the form values derived from the schema
type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage: React.FC = () => {
  const { register: registerUser, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [inviteRequestSubmitted, setInviteRequestSubmitted] = useState(false);
  const [inviteRequestLoading, setInviteRequestLoading] = useState(false);
  const [inviteRequestError, setInviteRequestError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get invite token from URL
  const inviteToken = searchParams.get('token') || '';
  const inviteEmail = searchParams.get('email') || '';
  
  // Redirect authenticated users away from registration page
  useAuthRedirect({ redirectAuthenticated: true });
  
  // Generate unique IDs for form elements
  const formId = useId();
  const firstNameErrorId = `${formId}-firstName-error`;
  const lastNameErrorId = `${formId}-lastName-error`;
  const emailErrorId = `${formId}-email-error`;
  const passwordErrorId = `${formId}-password-error`;
  const confirmPasswordErrorId = `${formId}-confirmPassword-error`;
  const currencyErrorId = `${formId}-currency-error`;
  const authErrorId = `${formId}-auth-error`;
  
  // Initialize React Hook Form with Zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: inviteEmail,
      password: '',
      confirmPassword: '',
      currency: 'USD',
      inviteToken: inviteToken,
    },
  });
  
  // Focus management
  const authErrorRef = useRef<HTMLDivElement>(null);
  const formRef = useFocusTrap<HTMLFormElement>(true);
  
  // Check if valid invite token is present
  useEffect(() => {
    if (!inviteToken) {
      setAuthError(null); // Clear error since we'll show invite request form instead
    } else {
      setAuthError(null);
    }
  }, [inviteToken]);

  // Set initial focus on first name input
  const firstNameInputRef = useFocusManagement<HTMLInputElement>(true, []);

  // Handle registration form submission
  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    
    try {
      // Convert form values to RegisterRequest type
      const registerData: RegisterRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        currency: values.currency,
        inviteToken: values.inviteToken,
      };
      
      await registerUser(registerData);
      
      // On successful registration, navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      // Use our utility function to handle authentication errors
      handleAuthError(err, setAuthError, authErrorRef as React.RefObject<HTMLElement>);
    }
  };

  // Handle invitation request submission
  const handleInviteRequest = async (data: CreateInviteRequestByUser) => {
    setInviteRequestLoading(true);
    setInviteRequestError(null);
    
    try {
      await authApi.requestInvite(data);
      setInviteRequestSubmitted(true);
    } catch (err: any) {
      setInviteRequestError(err.message || 'Failed to submit invitation request');
      throw err; // Re-throw to let the component handle it
    } finally {
      setInviteRequestLoading(false);
    }
  };

  // If no invite token, show invitation request form
  if (!inviteToken) {
    return (
      <InviteRequestForm 
        onSubmit={handleInviteRequest}
        loading={inviteRequestLoading}
        error={inviteRequestError}
        onSuccess={inviteRequestSubmitted}
      />
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="p-2 pt-4">
          <AuthHeader 
            title="Accept your invitation"
            subtitle="Or"
            linkText="sign in to your existing account"
            linkUrl="/login"
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
              aria-label="Registration form"
              noValidate
            >
              {/* Responsive grid for name fields - stack on mobile, side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor={`${formId}-firstName`}>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          ref={(e) => {
                            field.ref(e);
                            firstNameInputRef.current = e;
                          }}
                          id={`${formId}-firstName`}
                          placeholder="First name" 
                          className="sm:text-sm"
                          autoComplete="given-name"
                          aria-required="true"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? firstNameErrorId : undefined}
                        />
                      </FormControl>
                      <FormMessage id={firstNameErrorId} />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor={`${formId}-lastName`}>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          id={`${formId}-lastName`}
                          placeholder="Last name" 
                          className="sm:text-sm"
                          autoComplete="family-name"
                          aria-required="true"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? lastNameErrorId : undefined}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage id={lastNameErrorId} />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${formId}-email`}>Email address</FormLabel>
                    <FormControl>
                      <Input 
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
                        placeholder="Create a password" 
                        type="password"
                        autoComplete="new-password"
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
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${formId}-confirmPassword`}>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        id={`${formId}-confirmPassword`}
                        placeholder="Confirm your password" 
                        type="password"
                        autoComplete="new-password"
                        className="sm:text-sm"
                        aria-required="true"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? confirmPasswordErrorId : undefined}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage id={confirmPasswordErrorId} />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field, fieldState }) => {
                  const currencyId = `${formId}-currency`;
                  const currencyDescriptionId = `${currencyId}-description`;
                  return (
                    <FormItem>
                      <FormLabel htmlFor={currencyId}>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger 
                            id={currencyId}
                            className="sm:text-sm"
                            aria-required="true"
                            aria-invalid={!!fieldState.error}
                            aria-describedby={`${fieldState.error ? currencyErrorId : ''} ${currencyDescriptionId}`}
                          >
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem 
                              key={currency.value} 
                              value={currency.value}
                            >
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage id={currencyErrorId} />
                      <p 
                        id={currencyDescriptionId}
                        className="text-xs text-muted-foreground mt-1"
                      >
                        This will be your default currency for all subscriptions
                      </p>
                    </FormItem>
                  );
                }}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loading}
                aria-label="Create account"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-primary-600 hover:text-primary-500 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
                    aria-label="Sign in to your existing account"
                  >
                    Sign in
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

export { RegisterPage };
export default RegisterPage;