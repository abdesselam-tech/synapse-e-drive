/**
 * Admin Groups Page
 * Create and manage learning groups
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllGroups } from '@/lib/server/actions/groups';
import AdminGroupForm from '@/components/groups/AdminGroupForm';
import AdminGroupsList from '@/components/groups/AdminGroupsList';
import type { Group } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const stats = {
    total: groups.length,
    active: groups.filter(g => g.status === 'active').length,
    inactive: groups.filter(g => g.status === 'inactive').length,
    totalCapacity: groups.reduce((sum, g) => sum + g.maxStudents, 0),
    totalStudents: groups.reduce((sum, g) => sum + g.currentStudents, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Groups Management</h1>
          <p className="text-gray-600">Create and manage learning groups</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Hide Form' : 'Create Group'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Groups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalCapacity}</div>
            <div className="text-sm text-gray-600">Total Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <AdminGroupForm 
          onSuccess={() => { 
            loadGroups(); 
            setShowCreateForm(false); 
          }} 
        />
      )}

      {/* Groups List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading groups...</p>
        </div>
      ) : (
        <AdminGroupsList groups={groups} onUpdated={loadGroups} />
      )}
    </div>
  );
}
