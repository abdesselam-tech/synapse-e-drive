'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { createSession } from '@/lib/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken();
      await createSession(idToken);

      const userDoc = await getDoc(doc(db, 'users', credentials.user.uid));
      const userRole = userDoc.exists() ? userDoc.data().role : null;

      if (userRole) {
        router.push(`/${userRole}/dashboard`);
      } else {
        router.push('/auth/signup?error=missing-role');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';

      const errorCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : undefined;
      const errorText = err instanceof Error ? err.message : undefined;

      switch (errorCode) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = errorText || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/app/auth/login/page.tsx:90',message:'login page mounted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
