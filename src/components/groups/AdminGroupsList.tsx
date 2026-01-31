/**
 * Admin Groups List Component
 * Displays all groups with management actions
 */

'use client';

import { useState } from 'react';
import { updateGroup, deleteGroup } from '@/lib/server/actions/groups';
import type { Group } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminGroupsListProps {
  groups: Group[];
  onUpdated?: () => void;
}

export default function AdminGroupsList({ groups, onUpdated }: AdminGroupsListProps) {
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleDelete(groupId: string, groupName: string) {
    if (!confirm(`Delete group "${groupName}"? This will remove all members, schedules, and resources.`)) {
      return;
    }

    setLoading(true);
    const result = await deleteGroup(groupId);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Group deleted' });
      if (onUpdated) onUpdated();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' });
    }
    
    setLoading(false);
  }

  async function handleStatusChange(groupId: string, newStatus: 'active' | 'inactive' | 'archived') {
    setLoading(true);
    const result = await updateGroup({ groupId, status: newStatus });
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Status updated' });
      if (onUpdated) onUpdated();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }
    
    setLoading(false);
  }

  function formatDate(isoString: string | undefined): string {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No groups created yet.</p>
          <p className="text-sm text-gray-400 mt-2">Create your first group to get started.</p>
        </CardContent>
      </Card>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{group.name}</div>
                  <div className="text-xs text-gray-500 max-w-xs truncate">{group.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{group.teacherName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    group.currentStudents >= group.maxStudents ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {group.currentStudents}/{group.maxStudents}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{group.schedule || '-'}</div>
                  {group.startDate && (
                    <div className="text-xs text-gray-500">
                      {formatDate(group.startDate)} - {formatDate(group.endDate)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={group.status}
                    onChange={(e) => handleStatusChange(group.id, e.target.value as 'active' | 'inactive' | 'archived')}
                    disabled={loading}
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(group.status)}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <a
                      href={`/admin/groups/${group.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Manage
                    </a>
                    <button
                      onClick={() => handleDelete(group.id, group.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
