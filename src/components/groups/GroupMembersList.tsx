/**
 * Group Members List Component
 * Displays group members with phase badges and management options
 */

'use client';

import { useState } from 'react';
import { removeStudentFromGroup, updateStudentPhase } from '@/lib/server/actions/groups';
import { PHASE_LABELS, PHASE_COLORS, ALLOWED_TRANSITIONS } from '@/lib/utils/constants/phases';
import type { GroupMember, LearningPhase } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GroupMembersListProps {
  members: GroupMember[];
  groupId: string;
  onUpdated?: () => void;
  canManage?: boolean;
  canAdvancePhase?: boolean;
}

export default function GroupMembersList({ 
  members, 
  groupId, 
  onUpdated,
  canManage = true,
  canAdvancePhase = false,
}: GroupMembersListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Advance phase modal state
  const [advanceModal, setAdvanceModal] = useState<GroupMember | null>(null);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [advancing, setAdvancing] = useState(false);

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

  async function handleAdvancePhase() {
    if (!advanceModal || advanceNotes.length < 5) return;

    const currentPhase = advanceModal.phase || 'code';
    const nextPhase = ALLOWED_TRANSITIONS[currentPhase];
    
    if (!nextPhase) return;

    setAdvancing(true);
    setMessage(null);

    const result = await updateStudentPhase({
      groupId,
      studentId: advanceModal.studentId,
      newPhase: nextPhase,
      notes: advanceNotes,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Phase updated' });
      setAdvanceModal(null);
      setAdvanceNotes('');
      if (onUpdated) {
        setTimeout(onUpdated, 1000);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update phase' });
    }

    setAdvancing(false);
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getPhaseLabel(phase: string | undefined): string {
    return PHASE_LABELS[phase || 'code'] || phase || 'Code';
  }

  function getPhaseColor(phase: string | undefined): string {
    return PHASE_COLORS[phase || 'code'] || PHASE_COLORS['code'];
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              {(canManage || canAdvancePhase) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => {
              const currentPhase = member.phase || 'code';
              const nextPhase = ALLOWED_TRANSITIONS[currentPhase];
              const canAdvance = canAdvancePhase && nextPhase !== null && currentPhase !== 'passed';
              
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.studentName}</div>
                    <div className="text-xs text-gray-500">{member.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(currentPhase)}`}>
                      {getPhaseLabel(currentPhase)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{formatDate(member.joinedAt)}</div>
                  </td>
                  {(canManage || canAdvancePhase) && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {canAdvance && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdvanceModal(member);
                              setAdvanceNotes('');
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            ▲ Advance
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(member.studentId, member.studentName)}
                            disabled={loading === member.studentId}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {loading === member.studentId ? 'Removing...' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Advance Phase Modal */}
      {advanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Advance Phase — {advanceModal.studentName}</h3>
            
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Current:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(advanceModal.phase)}`}>
                {getPhaseLabel(advanceModal.phase)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-600">Next:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(ALLOWED_TRANSITIONS[advanceModal.phase || 'code'] || undefined)}`}>
                {getPhaseLabel(ALLOWED_TRANSITIONS[advanceModal.phase || 'code'] || undefined)}
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for advancing <span className="text-red-500">*</span>
              </label>
              <textarea
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="Reason for advancing this student..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={advancing}
              />
              {advanceNotes.length > 0 && advanceNotes.length < 5 && (
                <p className="text-sm text-red-500 mt-1">
                  Notes must be at least 5 characters ({advanceNotes.length}/5)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAdvanceModal(null);
                  setAdvanceNotes('');
                }}
                disabled={advancing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdvancePhase}
                disabled={advanceNotes.length < 5 || advancing}
                className="flex-1"
              >
                {advancing ? 'Advancing...' : 'Advance Phase'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
