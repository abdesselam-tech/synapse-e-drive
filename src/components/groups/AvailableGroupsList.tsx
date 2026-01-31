/**
 * Available Groups List Component
 * For students to browse and join groups
 */

'use client';

import { useState } from 'react';
import { joinGroup } from '@/lib/server/actions/groups';
import type { Group } from '@/lib/types/group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AvailableGroupsListProps {
  groups: Group[];
  onJoined?: () => void;
  disabled?: boolean; // When student already has a group
}

export default function AvailableGroupsList({ groups, onJoined, disabled = false }: AvailableGroupsListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleJoin(groupId: string) {
    setLoading(groupId);
    setMessage(null);

    const result = await joinGroup({ groupId });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Joined group successfully!' });
      if (onJoined) {
        setTimeout(onJoined, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to join group' });
    }

    setLoading(null);
  }

  function formatDate(isoString: string | undefined): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📚</div>
          <p className="text-gray-600 text-lg">No available groups right now</p>
          <p className="text-gray-500 text-sm mt-2">Check back later or contact admin</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const spotsLeft = group.maxStudents - group.currentStudents;
          const isLimited = spotsLeft <= 3;
          
          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isLimited ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
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
                    {group.startDate && (
                      <div className="flex items-center gap-2">
                        <span>🗓️</span>
                        <span>{formatDate(group.startDate)} - {formatDate(group.endDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>{group.currentStudents}/{group.maxStudents} students</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleJoin(group.id)}
                    disabled={loading === group.id || disabled}
                    className="w-full"
                    title={disabled ? 'You must leave your current group first' : undefined}
                  >
                    {loading === group.id ? 'Joining...' : disabled ? 'Already in a Group' : 'Join Group'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
