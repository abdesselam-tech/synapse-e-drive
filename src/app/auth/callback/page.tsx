'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * Auth callback inner component
 * Handles OAuth redirects and email verification links
 */
function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Check for error in URL params (OAuth errors)
    const error = searchParams.get('error');
    if (error) {
      console.error('Auth error:', error);
      router.push(`/auth/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // If user is authenticated, redirect to their dashboard
    if (user) {
      if (user.role) {
        router.push(`/${user.role}/dashboard`);
      } else {
        // User needs role assignment
        router.push('/auth/signup?error=missing-role');
      }
      return;
    }

    // If no user and no error, redirect to login
    router.push('/auth/login');
  }, [user, loading, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="text-lg">Processing authentication...</div>
        <div className="text-sm text-muted-foreground">
          Please wait while we redirect you.
        </div>
      </div>
    </div>
  );
}

/**
 * Auth callback page wrapper with Suspense
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
