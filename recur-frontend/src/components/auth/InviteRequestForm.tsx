import React, { useState, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from './';
import AuthHeader from './AuthHeader';
import FormError from './FormError';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import {
  Card,
  CardHeader,
  CardContent,
} from '../ui/card';
import { useFocusManagement, useFocusTrap } from '../../hooks/useFocusManagement';
import { handleAuthError } from '../../utils/auth-utils';

// Define the invitation request form schema using Zod
const inviteRequestFormSchema = z.object({
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
  message: z
    .string()
    .max(1000, { message: 'Message must be less than 1000 characters' })
    .optional(),
});

// Type for the form values derived from the schema
type InviteRequestFormValues = z.infer<typeof inviteRequestFormSchema>;

interface InviteRequestFormProps {
  onSubmit: (data: InviteRequestFormValues) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onSuccess?: boolean;
}

const InviteRequestForm: React.FC<InviteRequestFormProps> = ({ 
  onSubmit, 
  loading = false, 
  error = null,
  onSuccess = false 
}) => {
  const [submitError, setSubmitError] = useState<string | null>(error);
  
  // Generate unique IDs for form elements
  const formId = useId();
  const firstNameErrorId = `${formId}-firstName-error`;
  const lastNameErrorId = `${formId}-lastName-error`;
  const emailErrorId = `${formId}-email-error`;
  const messageErrorId = `${formId}-message-error`;
  const authErrorId = `${formId}-auth-error`;
  
  // Initialize React Hook Form with Zod validation
  const form = useForm<InviteRequestFormValues>({
    resolver: zodResolver(inviteRequestFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    },
  });
  
  // Focus management
  const authErrorRef = useRef<HTMLDivElement>(null);
  const formRef = useFocusTrap<HTMLFormElement>(true);
  
  // Set initial focus on first name input
  const firstNameInputRef = useFocusManagement<HTMLInputElement>(true, []);

  // Handle form submission
  const handleSubmit = async (values: InviteRequestFormValues) => {
    setSubmitError(null);
    
    try {
      await onSubmit(values);
    } catch (err) {
      // Use our utility function to handle authentication errors
      handleAuthError(err, setSubmitError, authErrorRef as React.RefObject<HTMLElement>);
    }
  };

  if (onSuccess) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="p-2 pt-4">
            <AuthHeader 
              title="Request submitted successfully"
              subtitle="Or"
              linkText="sign in to your existing account"
              linkUrl="/login"
            />
          </CardHeader>
          
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Your invitation request has been submitted and is pending review by an administrator.
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive an email with your invitation link once it's approved.
              </p>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
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
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="p-2 pt-4">
          <AuthHeader 
            title="Request an invitation"
            subtitle="Or"
            linkText="sign in to your existing account"
            linkUrl="/login"
          />
        </CardHeader>
        
        <CardContent>
          {(submitError || error) && (
            <div ref={authErrorRef} tabIndex={-1}>
              <FormError 
                id={authErrorId} 
                message={submitError || error} 
                className="mb-6" 
              />
            </div>
          )}
          
          <Form {...form}>
            <form 
              ref={formRef}
              onSubmit={form.handleSubmit(handleSubmit)} 
              className="space-y-4"
              aria-label="Invitation request form"
              noValidate
            >
              {/* Name fields in responsive grid */}
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
                name="message"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${formId}-message`}>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        id={`${formId}-message`}
                        placeholder="Tell us a bit about yourself or why you'd like to join..." 
                        className="sm:text-sm min-h-[80px]"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? messageErrorId : undefined}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage id={messageErrorId} />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loading}
                aria-label="Submit invitation request"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" aria-hidden="true" />
                    Submitting request...
                  </>
                ) : (
                  "Request Invitation"
                )}
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
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

export default InviteRequestForm; 