/**
 * Student Exam Requests List Component
 * Displays student's exam requests with status and cancel option
 */

'use client';

import { useState } from 'react';
import { cancelExamRequest } from '@/lib/server/actions/examRequests';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type { ExamRequest } from '@/lib/types/examRequest';

interface StudentRequestsListProps {
  requests: ExamRequest[];
  onRequestCancelled?: () => void;
}

export default function StudentRequestsList({ requests, onRequestCancelled }: StudentRequestsListProps) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleCancel(requestId: string) {
    if (!confirm('Are you sure you want to cancel this exam request?')) return;

    setCancelling(requestId);
    setMessage(null);

    const result = await cancelExamRequest({ requestId });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Request cancelled' });
      if (onRequestCancelled) {
        setTimeout(onRequestCancelled, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to cancel' });
    }

    setCancelling(null);
  }

  function getExamTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'theory': 'Theory Exam',
      'practical': 'Practical Driving Exam',
      'road-test': 'Road Test',
    };
    return labels[type] || type;
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { bg: string; text: string }> = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'approved': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800' },
      'passed': { bg: 'bg-green-100', text: 'text-green-800' },
      'failed': { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const badge = badges[status] || badges['pending'];
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  function formatDate(value?: string | number): string {
    if (!value) return 'Not set';
    const date = typeof value === 'number' ? new Date(value) : new Date(value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No exam requests yet.</p>
          <p className="text-sm text-gray-400 mt-2">Submit your first exam request to get started!</p>
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

      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{getExamTypeLabel(request.examType)}</h3>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Submitted on {formatDate(request.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {request.examDate && (
                <p className="text-gray-700">
                  <strong>Exam Date:</strong>{' '}
                  <span className="text-green-600 font-semibold">{formatDate(request.examDate)}</span>
                  {request.examTime && ` at ${request.examTime}`}
                </p>
              )}

              {request.studentNotes && (
                <p className="text-gray-700">
                  <strong>Your Notes:</strong> {request.studentNotes}
                </p>
              )}

              {request.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                  <strong className="text-blue-900">Admin Notes:</strong>
                  <p className="text-blue-800 mt-1">{request.adminNotes}</p>
                </div>
              )}

              {request.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                  <strong className="text-red-900">Rejection Reason:</strong>
                  <p className="text-red-800 mt-1">{request.rejectionReason}</p>
                </div>
              )}

              {request.result && (
                <p className="text-gray-700">
                  <strong>Result:</strong>{' '}
                  <span className={request.result === 'passed' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {request.result.toUpperCase()}
                  </span>
                </p>
              )}

              {request.reviewedByName && (
                <p className="text-xs text-gray-500 mt-2">
                  Reviewed by {request.reviewedByName} on {formatDate(request.reviewedAt)}
                </p>
              )}
            </div>

            {['pending', 'approved'].includes(request.status) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(request.id)}
                  disabled={cancelling === request.id}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {cancelling === request.id ? 'Cancelling...' : 'Cancel Request'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
