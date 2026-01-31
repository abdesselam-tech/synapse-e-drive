'use client';

import { useState } from 'react';
import { changeGroup } from '@/lib/server/actions/groups';

interface ChangeGroupFormProps {
  currentGroup: { id: string; name: string };
  availableGroups: Array<{ 
    id: string; 
    name: string; 
    teacherName: string; 
    currentStudents: number; 
    maxStudents: number;
  }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChangeGroupForm({ 
  currentGroup, 
  availableGroups, 
  onSuccess, 
  onCancel 
}: ChangeGroupFormProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedGroupId) {
      setError('Please select a group');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a reason (minimum 10 characters)');
      return;
    }

    setLoading(true);
    setError('');

    const result = await changeGroup(currentGroup.id, selectedGroupId, reason);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Failed to change groups');
      setLoading(false);
    }
  }

  // Filter out current group and full groups
  const filteredGroups = availableGroups.filter(g => 
    g.id !== currentGroup.id && g.currentStudents < g.maxStudents
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Change Group</h2>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Current Group:</span> {currentGroup.name}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            You will be removed from this group and added to the new one.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Group
            </label>
            {filteredGroups.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">No available groups to join.</p>
                <p className="text-xs text-gray-400 mt-1">
                  All other groups are either full or inactive.
                </p>
              </div>
            ) : (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select a group --</option>
                {filteredGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.teacherName} ({group.currentStudents}/{group.maxStudents} students)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Explain why you want to change groups (e.g., schedule conflict, location preference...)"
              required
              minLength={10}
            />
            <p className={`text-xs mt-1 ${reason.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
              {reason.length}/10 characters minimum {reason.length >= 10 && '✓'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading || filteredGroups.length === 0}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Changing...
                </span>
              ) : (
                'Change Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
