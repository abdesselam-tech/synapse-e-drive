/**
 * Create User Form Component
 * Admin form for creating new users
 */

'use client';

import { useState } from 'react';
import { createUser } from '@/lib/server/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export default function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createUser({
      email,
      password,
      displayName,
      role,
      phoneNumber: phoneNumber || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'User created!' });
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('student');
      setPhoneNumber('');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create user' });
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Password *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <Label>Display Name *</Label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Role *</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'teacher' | 'student')}
              className="mt-1"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </Select>
          </div>

          <div>
            <Label>Phone Number (Optional)</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating User...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
