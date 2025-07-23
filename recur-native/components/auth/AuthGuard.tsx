import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string | undefined;
}

/**
 * AuthGuard component that protects routes requiring authentication
 * and redirects to login when unauthenticated
 */
export function AuthGuard({ children, requireAuth = true, redirectTo = '/auth/login' }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Skip protection during initial loading
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    // If user is not authenticated and not on an auth screen, redirect to login
    if (requireAuth && !isAuthenticated && !inAuthGroup) {
      // Use router.replace with type assertion for dynamic routes
      router.replace(redirectTo as any);
    }
    
    // If user is authenticated and on an auth screen, redirect to home
    if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router, requireAuth, redirectTo]);

  return <>{children}</>;
}