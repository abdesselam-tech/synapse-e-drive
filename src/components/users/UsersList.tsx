/**
 * Users List Component
 * Admin view of all users with edit/delete functionality
 */

'use client';

import { useState } from 'react';
import { updateUser, deleteUser } from '@/lib/server/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserData } from '@/lib/server/actions/users';

interface UsersListProps {
  users: UserData[];
  onUserUpdated?: () => void;
}

export default function UsersList({ users, onUserUpdated }: UsersListProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [editPhone, setEditPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function startEdit(user: UserData) {
    setEditingUser(user.id);
    setEditName(user.displayName || '');
    setEditRole(user.role as 'admin' | 'teacher' | 'student');
    setEditPhone(user.phoneNumber || '');
    setMessage(null);
  }

  function cancelEdit() {
    setEditingUser(null);
    setEditName('');
    setEditRole('student');
    setEditPhone('');
  }

  async function handleUpdate(userId: string) {
    setLoading(true);
    setMessage(null);

    const result = await updateUser({
      userId,
      displayName: editName,
      role: editRole,
      phoneNumber: editPhone || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'User updated' });
      setEditingUser(null);
      if (onUserUpdated) {
        setTimeout(onUserUpdated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }

    setLoading(false);
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await deleteUser({ userId });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'User deleted' });
      if (onUserUpdated) {
        setTimeout(onUserUpdated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' });
    }

    setLoading(false);
  }

  function getRoleBadge(role: string) {
    const badges: Record<string, { bg: string; text: string }> = {
      'admin': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'teacher': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'student': { bg: 'bg-green-100', text: 'text-green-800' },
    };
    const badge = badges[role] || badges['student'];
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  {editingUser === user.id ? (
                    <>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <Select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'teacher' | 'student')}
                          className="w-full"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(user.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.displayName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phoneNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id, user.displayName || user.email)}
                          disabled={loading}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
