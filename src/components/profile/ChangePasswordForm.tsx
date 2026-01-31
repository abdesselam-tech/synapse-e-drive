/**
 * Change Password Form Component
 * Form for changing user password
 */

'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChangePasswordFormProps {
  userEmail: string;
}

export default function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords don't match" });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      // First, re-authenticate user with current password (required by Firebase)
      await signInWithEmailAndPassword(auth, userEmail, currentPassword);

      // Update password in Firebase Auth (client-side)
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('No authenticated user');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
      } else if (err.code === 'auth/weak-password') {
        setMessage({ type: 'error', text: 'Password is too weak' });
      } else if (err.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log out and log back in, then try again' });
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to change password' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
