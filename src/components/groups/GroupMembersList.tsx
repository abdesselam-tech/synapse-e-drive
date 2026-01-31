/**
 * Group Members List Component
 * Displays group members with management options for teachers
 */

'use client';

import { useState } from 'react';
import { removeStudentFromGroup } from '@/lib/server/actions/groups';
import type { GroupMember } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GroupMembersListProps {
  members: GroupMember[];
  groupId: string;
  onUpdated?: () => void;
  canManage?: boolean;
}

export default function GroupMembersList({ 
  members, 
  groupId, 
  onUpdated,
  canManage = true 
}: GroupMembersListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleRemove(studentId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from this group?`)) {
      return;
    }

    setLoading(studentId);
    setMessage(null);

    const result = await removeStudentFromGroup(groupId, studentId);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Student removed' });
      if (onUpdated) {
        setTimeout(onUpdated, 1000);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove student' });
    }

    setLoading(null);
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">👥</div>
          <p className="text-gray-600">No members in this group yet</p>
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{member.studentName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{member.studentEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatDate(member.joinedAt)}</div>
                </td>
                {canManage && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.studentId, member.studentName)}
                      disabled={loading === member.studentId}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {loading === member.studentId ? 'Removing...' : 'Remove'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
