/**
 * Admin Group Detail Page
 * View and manage group members, schedules, and resources
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getGroupById,
  getGroupMembers,
  getGroupSchedules,
  getGroupResources,
  adminAddStudentToGroup,
  adminRemoveStudentFromGroup,
} from '@/lib/server/actions/groups';
import { getAllUsers } from '@/lib/server/actions/users';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupSchedulesList from '@/components/groups/GroupSchedulesList';
import GroupResourcesList from '@/components/groups/GroupResourcesList';
import type { Group, GroupMember, GroupSchedule, GroupResource } from '@/lib/types/group';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/utils/constants/phases';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface StudentOption {
  id: string;
  email: string;
  displayName: string | null;
}

export default function AdminGroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'schedules' | 'resources'>('members');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add student modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Remove student modal state
  const [removeModal, setRemoveModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removingStudent, setRemovingStudent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, membersData, schedulesData, resourcesData] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId),
        getGroupSchedules(groupId),
        getGroupResources(groupId),
      ]);

      setGroup(groupData);
      setMembers(membersData);
      setSchedules(schedulesData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadAvailableStudents = useCallback(async () => {
    try {
      const allUsers = await getAllUsers();
      // Filter to students only
      const students = allUsers
        .filter(u => u.role === 'student')
        .map(u => ({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
        }));
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setAddMessage(null);
    setSelectedStudentId('');
    await loadAvailableStudents();
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    
    setAddingStudent(true);
    setAddMessage(null);

    const result = await adminAddStudentToGroup({
      groupId,
      studentId: selectedStudentId,
    });

    if (result.success) {
      setAddMessage({ type: 'success', text: result.message || 'Student added successfully' });
      setSelectedStudentId('');
      await loadData();
      setTimeout(() => {
        setShowAddModal(false);
        setAddMessage(null);
      }, 1500);
    } else {
      setAddMessage({ type: 'error', text: result.error || 'Failed to add student' });
    }

    setAddingStudent(false);
  };

  const handleRemoveStudent = async () => {
    if (!removeModal || removeReason.length < 10) return;

    setRemovingStudent(true);

    const result = await adminRemoveStudentFromGroup({
      groupId,
      studentId: removeModal.studentId,
      reason: removeReason,
    });

    if (result.success) {
      setRemoveModal(null);
      setRemoveReason('');
      await loadData();
    } else {
      alert(result.error || 'Failed to remove student');
    }

    setRemovingStudent(false);
  };

  // Filter out students already in this group
  const filteredStudents = availableStudents.filter(
    s => !members.some(m => m.studentId === s.id)
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
        <a href="/admin/groups" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Groups
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a href="/admin/groups" className="text-blue-600 hover:underline">
              ← Back
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
          <div className="text-sm text-gray-500 mt-2">
            Teacher: {group.teacherName} • {group.schedule || 'No schedule set'}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          group.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : group.status === 'inactive'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {group.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{members.length}</div>
            <div className="text-sm text-gray-600">Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{schedules.length}</div>
            <div className="text-sm text-gray-600">Schedules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{resources.length}</div>
            <div className="text-sm text-gray-600">Resources</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'members'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'schedules'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Schedules ({schedules.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'resources'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Resources ({resources.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Add Student Button */}
          <div className="flex justify-end">
            <Button onClick={handleOpenAddModal}>
              + Add Student
            </Button>
          </div>
          
          {/* Members List with custom remove handler */}
          <AdminGroupMembersList 
            members={members} 
            onRemove={(studentId, studentName) => {
              setRemoveModal({ studentId, studentName });
              setRemoveReason('');
            }}
          />
        </div>
      )}
      {activeTab === 'schedules' && (
        <GroupSchedulesList schedules={schedules} groupId={groupId} onUpdated={loadData} />
      )}
      {activeTab === 'resources' && (
        <GroupResourcesList resources={resources} groupId={groupId} onUpdated={loadData} />
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Student to Group</h3>
            
            {addMessage && (
              <Alert variant={addMessage.type === 'success' ? 'success' : 'error'} className="mb-4">
                {addMessage.text}
              </Alert>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={addingStudent}
              >
                <option value="">-- Select a student --</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.displayName || student.email} ({student.email})
                  </option>
                ))}
              </select>
              {filteredStudents.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No available students. All students are already in groups.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={addingStudent}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!selectedStudentId || addingStudent}
                className="flex-1"
              >
                {addingStudent ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Modal */}
      {removeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Remove Student from Group</h3>
            <p className="text-gray-600 mb-4">
              Remove <strong>{removeModal.studentName}</strong> from this group?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for removal <span className="text-red-500">*</span>
              </label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Enter reason for removal, e.g. payment issue, transfer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={removingStudent}
              />
              {removeReason.length > 0 && removeReason.length < 10 && (
                <p className="text-sm text-red-500 mt-1">
                  Reason must be at least 10 characters ({removeReason.length}/10)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRemoveModal(null);
                  setRemoveReason('');
                }}
                disabled={removingStudent}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveStudent}
                disabled={removeReason.length < 10 || removingStudent}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {removingStudent ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin-specific members list with custom remove button and phase badges
function AdminGroupMembersList({ 
  members, 
  onRemove 
}: { 
  members: GroupMember[]; 
  onRemove: (studentId: string, studentName: string) => void;
}) {
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{member.studentName}</div>
                <div className="text-xs text-gray-500">{member.studentEmail}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(member.phase)}`}>
                  {getPhaseLabel(member.phase)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">{formatDate(member.joinedAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(member.studentId, member.studentName)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
