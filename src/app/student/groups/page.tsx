/**
 * Student Groups Page
 * Browse and join groups, view joined groups
 * Note: Students can only be in ONE group at a time
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAvailableGroups, getStudentGroups } from '@/lib/server/actions/groups';
import AvailableGroupsList from '@/components/groups/AvailableGroupsList';
import StudentGroupDashboard from '@/components/groups/StudentGroupDashboard';
import ChangeGroupForm from '@/components/groups/ChangeGroupForm';
import type { Group } from '@/lib/types/group';

export default function StudentGroupsPage() {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'available'>('my-groups');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]); // For change form
  const [loading, setLoading] = useState(true);
  const [showChangeForm, setShowChangeForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      const { uid } = await response.json();

      const [mine, available] = await Promise.all([
        getStudentGroups(uid),
        getAvailableGroups(),
      ]);

      setMyGroups(mine);
      setAllGroups(available); // Keep all for change form
      // Filter out groups the student already joined
      const joinedIds = new Set(mine.map(g => g.id));
      setAvailableGroups(available.filter(g => !joinedIds.has(g.id)));
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChangeSuccess = () => {
    setShowChangeForm(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Groups</h1>
          <p className="text-gray-600">Join a learning group and access exclusive content</p>
        </div>
        
        {/* Change Group Button - Only show if student has a group */}
        {myGroups.length > 0 && (
          <button
            onClick={() => setShowChangeForm(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Change Group
          </button>
        )}
      </div>

      {/* Info Banner - One group limit */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium">One Group Policy</p>
            <p className="text-sm text-blue-700 mt-1">
              Students can only be a member of one group at a time. 
              {myGroups.length > 0 
                ? ' Use the "Change Group" button to switch to a different group.'
                : ' Browse available groups below to join one.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('my-groups')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my-groups'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Group {myGroups.length > 0 && `(${myGroups.length})`}
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Available Groups ({availableGroups.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading groups...</p>
        </div>
      ) : activeTab === 'my-groups' ? (
        <StudentGroupDashboard groups={myGroups} onUpdated={loadData} />
      ) : (
        <>
          {myGroups.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> You are already a member of &quot;{myGroups[0].name}&quot;. 
                To join a different group, use the &quot;Change Group&quot; button above.
              </p>
            </div>
          )}
          <AvailableGroupsList 
            groups={availableGroups} 
            onJoined={loadData}
            disabled={myGroups.length > 0}
          />
        </>
      )}

      {/* Change Group Modal */}
      {showChangeForm && myGroups.length > 0 && (
        <ChangeGroupForm
          currentGroup={{ id: myGroups[0].id, name: myGroups[0].name }}
          availableGroups={allGroups.map(g => ({
            id: g.id,
            name: g.name,
            teacherName: g.teacherName,
            currentStudents: g.currentStudents,
            maxStudents: g.maxStudents,
          }))}
          onSuccess={handleChangeSuccess}
          onCancel={() => setShowChangeForm(false)}
        />
      )}
    </div>
  );
}
