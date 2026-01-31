/**
 * Student Group Dashboard Component
 * Shows joined groups with access to schedules and resources
 */

'use client';

import { useState } from 'react';
import { leaveGroup } from '@/lib/server/actions/groups';
import type { Group } from '@/lib/types/group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudentGroupDashboardProps {
  groups: Group[];
  onUpdated?: () => void;
}

export default function StudentGroupDashboard({ groups, onUpdated }: StudentGroupDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleLeave(groupId: string, groupName: string) {
    if (!confirm(`Are you sure you want to leave "${groupName}"? You may need to request to rejoin.`)) {
      return;
    }

    setLoading(groupId);
    setMessage(null);

    const result = await leaveGroup(groupId);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Left group successfully' });
      if (onUpdated) {
        setTimeout(onUpdated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to leave group' });
    }

    setLoading(null);
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">You haven't joined any groups yet</p>
          <p className="text-gray-500 text-sm mt-2">Browse available groups to join one</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  group.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>👨‍🏫</span>
                    <span>{group.teacherName}</span>
                  </div>
                  {group.schedule && (
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{group.schedule}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{group.currentStudents} students</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <a
                    href={`/student/groups/${group.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    onClick={() => handleLeave(group.id, group.name)}
                    disabled={loading === group.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {loading === group.id ? 'Leaving...' : 'Leave'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
