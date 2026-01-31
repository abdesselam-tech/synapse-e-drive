/**
 * Student Exam Requests Page
 * Submit and track exam requests
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStudentExamRequests } from '@/lib/server/actions/examRequests';
import ExamRequestForm from '@/components/examRequests/ExamRequestForm';
import StudentRequestsList from '@/components/examRequests/StudentRequestsList';
import type { ExamRequest } from '@/lib/types/examRequest';

export default function StudentExamRequestsPage() {
  const [activeTab, setActiveTab] = useState<'my-requests' | 'new-request'>('my-requests');
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user from API
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      const { uid } = await response.json();

      const data = await getStudentExamRequests(uid);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  function handleRequestCreated() {
    loadRequests();
    setActiveTab('my-requests');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Requests</h1>
        <p className="text-gray-600">Request and track your driving exams</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'my-requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('new-request')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'new-request'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New Request
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'my-requests' && (
            <StudentRequestsList requests={requests} onRequestCancelled={loadRequests} />
          )}
          {activeTab === 'new-request' && (
            <ExamRequestForm onSuccess={handleRequestCreated} />
          )}
        </>
      )}
    </div>
  );
}
