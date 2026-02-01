'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { checkIfAdminsExist, createFirstAdmin, createSession } from '@/lib/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function FirstAdminPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if admin already exists on mount
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { hasAdmin } = await checkIfAdminsExist();
        if (hasAdmin) {
          // Admin exists, redirect to login
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        // If error, redirect to login for safety
        router.replace('/auth/login');
      } finally {
        setChecking(false);
      }
    }

    checkAdmin();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Create the first admin account
      const result = await createFirstAdmin({
        email,
        password,
        name: name.trim(),
      });

      if (!result.success) {
        setError(result.error || 'Failed to create admin account');
        return;
      }

      // Sign in with the new account
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken();
      await createSession(idToken);

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      console.error('First admin creation error:', err);
      
      let errorMessage = 'Failed to create admin account. Please try again.';
      const errorText = err instanceof Error ? err.message : undefined;
      
      if (errorText) {
        errorMessage = errorText;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking for existing admin
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="text-4xl mb-2">🚗</div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Synapse E-Drive</h1>
          <p className="text-gray-600">
            Create your first administrator account to get started
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>First-time setup:</strong> This account will have full administrative access 
            to manage teachers, students, schedules, and all platform settings.
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Administrator Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@yourschool.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Administrator...' : 'Create Administrator Account'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          After creating this account, you can generate passcodes for teachers and students 
          from the admin dashboard.
        </p>
      </Card>
    </div>
  );
}
