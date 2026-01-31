/**
 * Admin Exam Requests Page
 * Review and manage all student exam requests
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllExamRequests } from '@/lib/server/actions/examRequests';
import AdminRequestsList from '@/components/examRequests/AdminRequestsList';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { ExamRequest } from '@/lib/types/examRequest';

export default function AdminExamRequestsPage() {
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllExamRequests({
        status: filterStatus || undefined,
        examType: filterExamType || undefined,
      });
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterExamType]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Requests Management</h1>
        <p className="text-gray-600">Review and manage student exam requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.scheduled}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <Label>Filter by Status</Label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="flex-1 min-w-48">
              <Label>Filter by Exam Type</Label>
              <Select
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                className="mt-1"
              >
                <option value="">All Types</option>
                <option value="theory">Theory Exam</option>
                <option value="practical">Practical Driving Exam</option>
                <option value="road-test">Road Test</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : (
        <AdminRequestsList requests={requests} onRequestUpdated={loadRequests} />
      )}
    </div>
  );
}
