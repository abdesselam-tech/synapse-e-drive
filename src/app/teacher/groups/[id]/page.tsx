/**
 * Teacher Group Detail Page
 * Manage group members, schedules, resources, and attendance
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getGroupById,
  getGroupMembers,
  getGroupSchedules,
  getGroupResources,
} from '@/lib/server/actions/groups';
import {
  getTodaySessionsForGroup,
  markGroupAttendance,
  getGroupAttendanceHistory,
  type TodaySession,
  type AttendanceHistoryEntry,
} from '@/lib/server/actions/attendance';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupSchedulesList from '@/components/groups/GroupSchedulesList';
import GroupResourcesList from '@/components/groups/GroupResourcesList';
import type { Group, GroupMember, GroupSchedule, GroupResource } from '@/lib/types/group';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/utils/constants/phases';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TeacherGroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'schedules' | 'resources'>('members');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance state
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState<TodaySession | null>(null);
  const [selectedPresent, setSelectedPresent] = useState<Set<string>>(new Set());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, membersData, schedulesData, resourcesData, sessionsData] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId),
        getGroupSchedules(groupId),
        getGroupResources(groupId),
        getTodaySessionsForGroup({ groupId }),
      ]);

      setGroup(groupData);
      setMembers(membersData);
      setSchedules(schedulesData);
      setResources(resourcesData);
      setTodaySessions(sessionsData);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadAttendanceHistory = useCallback(async () => {
    if (attendanceHistory.length > 0) return; // Already loaded
    setHistoryLoading(true);
    try {
      const history = await getGroupAttendanceHistory({ groupId });
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [groupId, attendanceHistory.length]);

  const openAttendanceModal = (session: TodaySession) => {
    // Pre-select all members as present
    const allMemberIds = new Set(members.map(m => m.studentId));
    setSelectedPresent(allMemberIds);
    setAttendanceModal(session);
    setAttendanceMessage(null);
  };

  const handleMarkAttendance = async () => {
    if (!attendanceModal) return;
    
    setAttendanceLoading(true);
    setAttendanceMessage(null);

    try {
      const result = await markGroupAttendance({
        groupScheduleId: attendanceModal.id,
        presentStudentIds: Array.from(selectedPresent),
      });

      if (result.success) {
        setAttendanceMessage({
          type: 'success',
          text: `Attendance marked: ${result.presentCount} present, ${result.absentCount} absent`,
        });
        // Refresh sessions after a short delay
        setTimeout(() => {
          setAttendanceModal(null);
          loadData();
        }, 1500);
      } else {
        setAttendanceMessage({ type: 'error', text: result.error || 'Failed to mark attendance' });
      }
    } catch (error) {
      setAttendanceMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const toggleStudentPresent = (studentId: string) => {
    setSelectedPresent(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <p className="text-gray-500">Group not found or unauthorized</p>
        <a href="/teacher/groups" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Groups
        </a>
      </div>
    );
  }

  const now = new Date();
  const upcomingSchedules = schedules.filter(s => new Date(s.date) >= now).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a href="/teacher/groups" className="text-blue-600 hover:underline">
              ← Back to Groups
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
          {group.schedule && (
            <div className="text-sm text-gray-500 mt-2">
              📅 {group.schedule}
            </div>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          group.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {group.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{members.length}</div>
            <div className="text-sm text-gray-600">Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{group.maxStudents}</div>
            <div className="text-sm text-gray-600">Capacity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{upcomingSchedules}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
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
          👥 Students ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'schedules'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Schedules ({schedules.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'resources'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📚 Resources ({resources.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'members' && (
        <GroupMembersList 
          members={members} 
          groupId={groupId} 
          onUpdated={loadData}
          canManage={true}
          canAdvancePhase={true}
        />
      )}
      {activeTab === 'schedules' && (
        <GroupSchedulesList 
          schedules={schedules} 
          groupId={groupId} 
          onUpdated={loadData}
          canManage={true}
        />
      )}
      {activeTab === 'resources' && (
        <GroupResourcesList 
          resources={resources} 
          groupId={groupId} 
          onUpdated={loadData}
          canManage={true}
        />
      )}

      {/* Attendance Section */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">📋 Today&apos;s Attendance</h2>
        
        {todaySessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No sessions scheduled for today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-sm font-medium ${session.status === 'not_started' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {session.startTime} – {session.endTime}
                    </div>
                    <div className={session.status === 'not_started' ? 'text-gray-400' : 'text-gray-700'}>
                      {session.topic}
                    </div>
                  </div>
                  <div>
                    {session.status === 'not_started' && (
                      <span className="text-sm text-gray-400">Opens at {session.startTime}</span>
                    )}
                    {session.status === 'marked' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Marked
                      </span>
                    )}
                    {session.status === 'pending' && (
                      <Button
                        onClick={() => openAttendanceModal(session)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        📋 Mark Attendance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Attendance History Accordion */}
        <div className="border rounded-lg">
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) loadAttendanceHistory();
            }}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <span className="font-medium text-gray-700">📊 Attendance History</span>
            <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
          </button>
          
          {showHistory && (
            <div className="border-t px-4 py-4">
              {historyLoading ? (
                <p className="text-gray-500 text-center py-4">Loading history...</p>
              ) : attendanceHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No attendance records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Date</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Present</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Absent</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Who was absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((entry, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-2">{entry.date}</td>
                          <td className="py-2 px-2 text-center text-green-600 font-medium">{entry.presentCount}</td>
                          <td className="py-2 px-2 text-center text-red-600 font-medium">{entry.absentCount}</td>
                          <td className="py-2 px-2 text-gray-600">
                            {entry.absentStudentNames.length > 0 
                              ? entry.absentStudentNames.join(', ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {attendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Mark Attendance — {new Date().toISOString().split('T')[0]} {attendanceModal.startTime}–{attendanceModal.endTime}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {attendanceMessage && (
                <Alert className={`mb-4 ${attendanceMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <AlertDescription className={attendanceMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {attendanceMessage.text}
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Check the students who are present. Unchecked students will be marked absent.
              </p>
              
              <div className="space-y-2">
                {members.map((member) => {
                  const phase = member.phase || 'code';
                  return (
                    <label
                      key={member.studentId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPresent.has(member.studentId)}
                        onChange={() => toggleStudentPresent(member.studentId)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex-1 font-medium text-gray-900">{member.studentName}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_COLORS[phase] || PHASE_COLORS['code']}`}>
                        {PHASE_LABELS[phase] || phase}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAttendanceModal(null)}
                disabled={attendanceLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAttendance}
                disabled={attendanceLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {attendanceLoading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
