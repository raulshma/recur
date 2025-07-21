import React from 'react';
import { AuthGuard } from './AuthGuard';

interface WithAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string | undefined;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requireAuth = true, redirectTo } = options;

  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <AuthGuard requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Convenience HOCs
export const withProtectedRoute = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requireAuth: true });

export const withPublicRoute = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requireAuth: false });