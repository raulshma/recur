import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  linkText?: string;
  linkUrl?: string;
}

/**
 * AuthHeader component
 * 
 * A reusable header component for authentication pages that includes
 * the logo, title, and optional subtitle with link.
 */
const AuthHeader: React.FC<AuthHeaderProps> = ({ 
  title, 
  subtitle, 
  linkText, 
  linkUrl 
}) => {
  return (
    <div>
      {/* <Logo /> */}
      <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
        {title}
      </h2>
      {subtitle && linkText && linkUrl && (
        <p className="mt-2 text-center text-sm text-gray-600">
          {subtitle}{' '}
          <Link
            to={linkUrl}
            className="font-medium text-primary-600 hover:text-primary-500"
            aria-label={linkText}
          >
            {linkText}
          </Link>
        </p>
      )}
    </div>
  );
};

export default AuthHeader;