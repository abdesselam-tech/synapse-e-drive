/**
 * Teacher Group Detail Page
 * Manage group members, schedules, and resources
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
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupSchedulesList from '@/components/groups/GroupSchedulesList';
import GroupResourcesList from '@/components/groups/GroupResourcesList';
import type { Group, GroupMember, GroupSchedule, GroupResource } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';

export default function TeacherGroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'schedules' | 'resources'>('members');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
