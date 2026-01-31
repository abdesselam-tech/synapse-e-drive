/**
 * Admin Users Management Page
 * Create, edit, and manage users
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllUsers, type UserData } from '@/lib/server/actions/users';
import CreateUserForm from '@/components/users/CreateUserForm';
import UsersList from '@/components/users/UsersList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleUserCreated() {
    loadUsers();
    setShowCreateForm(false);
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Create, edit, and manage users</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Hide Form' : 'Create User'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.teachers}</div>
            <div className="text-sm text-gray-600">Teachers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.students}</div>
            <div className="text-sm text-gray-600">Students</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && <CreateUserForm onSuccess={handleUserCreated} />}

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : (
        <UsersList users={users} onUserUpdated={loadUsers} />
      )}
    </div>
  );
}
