/**
 * Student Group Detail Page
 * View group schedules and resources (read-only)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getGroupById,
  getGroupSchedules,
  getGroupResources,
} from '@/lib/server/actions/groups';
import GroupSchedulesList from '@/components/groups/GroupSchedulesList';
import GroupResourcesList from '@/components/groups/GroupResourcesList';
import type { Group, GroupSchedule, GroupResource } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';

export default function StudentGroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'schedules' | 'resources'>('schedules');
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, schedulesData, resourcesData] = await Promise.all([
        getGroupById(groupId),
        getGroupSchedules(groupId),
        getGroupResources(groupId),
      ]);

      setGroup(groupData);
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
        <p className="text-gray-500">Group not found or you don't have access</p>
        <a href="/student/groups" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Groups
        </a>
      </div>
    );
  }

  const now = new Date();
  const upcomingSchedules = schedules.filter(s => new Date(s.date) >= now).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <a href="/student/groups" className="text-blue-600 hover:underline">
            ← Back to Groups
          </a>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
        <p className="text-gray-600">{group.description}</p>
        <div className="text-sm text-gray-500 mt-2">
          Teacher: {group.teacherName} • {group.schedule || 'Schedule varies'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{group.currentStudents}</div>
            <div className="text-sm text-gray-600">Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{upcomingSchedules}</div>
            <div className="text-sm text-gray-600">Upcoming Sessions</div>
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

      {/* Content - Read-only for students */}
      {activeTab === 'schedules' && (
        <GroupSchedulesList 
          schedules={schedules} 
          groupId={groupId} 
          onUpdated={loadData}
          canManage={false}
        />
      )}
      {activeTab === 'resources' && (
        <GroupResourcesList 
          resources={resources} 
          groupId={groupId} 
          onUpdated={loadData}
          canManage={false}
        />
      )}
    </div>
  );
}
