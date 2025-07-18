import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export type ErrorType = 'validation' | 'authentication' | 'server';

interface FormErrorProps {
  /**
   * The error message to display
   */
  message: string | null | undefined;
  
  /**
   * The type of error
   * - validation: Form validation errors
   * - authentication: Authentication-related errors (wrong password, etc.)
   * - server: Server or network errors
   */
  type?: ErrorType;
  
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
  
  /**
   * ID for the error message, used for aria-describedby
   */
  id?: string;
}

/**
 * FormError component
 * 
 * A reusable error display component for authentication forms.
 * Uses the Alert component from the UI library to display error messages.
 */
const FormError: React.FC<FormErrorProps> = ({ 
  message, 
  type = 'authentication',
  className,
  id
}) => {
  if (!message) return null;
  
  return (
    <Alert 
      variant="destructive" 
      className={className}
      role="alert"
      id={id}
    >
      <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default FormError;