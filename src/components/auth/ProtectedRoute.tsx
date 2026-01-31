'use client';

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        router.push(`/${user.role}/dashboard`);
        return;
      }

      if (requiredRoles && !requiredRoles.includes(user.role)) {
        router.push(`/${user.role}/dashboard`);
        return;
      }
    }
  }, [user, loading, requiredRole, requiredRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
