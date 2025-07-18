import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UseAuthRedirectOptions {
  /**
   * If true, redirect authenticated users away from the current page
   */
  redirectAuthenticated?: boolean;
  
  /**
   * If true, redirect unauthenticated users away from the current page
   */
  requireAuth?: boolean;
  
  /**
   * Path to redirect authenticated users to (default: '/dashboard')
   */
  authenticatedRedirectPath?: string;
  
  /**
   * Path to redirect unauthenticated users to (default: '/login')
   */
  unauthenticatedRedirectPath?: string;
}

/**
 * Hook to handle authentication-based redirects
 * 
 * @example
 * // Redirect authenticated users away from login page
 * useAuthRedirect({ redirectAuthenticated: true });
 * 
 * @example
 * // Require authentication for protected pages
 * useAuthRedirect({ requireAuth: true });
 */
export const useAuthRedirect = ({
  redirectAuthenticated = false,
  requireAuth = false,
  authenticatedRedirectPath = '/dashboard',
  unauthenticatedRedirectPath = '/login',
}: UseAuthRedirectOptions = {}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Wait until authentication state is determined
    if (loading) return;
    
    // Redirect authenticated users if needed
    if (redirectAuthenticated && isAuthenticated) {
      navigate(authenticatedRedirectPath);
    }
    
    // Redirect unauthenticated users if authentication is required
    if (requireAuth && !isAuthenticated) {
      navigate(unauthenticatedRedirectPath);
    }
  }, [
    isAuthenticated, 
    loading, 
    navigate, 
    redirectAuthenticated, 
    requireAuth,
    authenticatedRedirectPath,
    unauthenticatedRedirectPath
  ]);
  
  return { isAuthenticated, loading };
};