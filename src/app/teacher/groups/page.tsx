/**
 * Teacher Groups Page
 * View and manage assigned groups
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTeacherGroups } from '@/lib/server/actions/groups';
import TeacherGroupCard from '@/components/groups/TeacherGroupCard';
import type { Group } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      const { uid } = await response.json();

      const data = await getTeacherGroups(uid);
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
    totalStudents: groups.reduce((sum, g) => sum + g.currentStudents, 0),
    totalCapacity: groups.reduce((sum, g) => sum + g.maxStudents, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Groups</h1>
        <p className="text-gray-600">Manage your teaching groups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalCapacity > 0 
                ? Math.round((stats.totalStudents / stats.totalCapacity) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg. Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">👥</div>
            <p className="text-gray-600 text-lg">No groups assigned yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Contact your administrator to get groups assigned to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <TeacherGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
