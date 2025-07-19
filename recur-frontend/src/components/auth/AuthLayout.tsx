import React from 'react';
import KeyboardNavigation from './KeyboardNavigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout component
 * 
 * A reusable layout wrapper for authentication pages that provides
 * consistent styling and responsive behavior.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <KeyboardNavigation>
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
        role="main"
        aria-label="Authentication page"
      >
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>
    </KeyboardNavigation>
  );
};

export default AuthLayout;