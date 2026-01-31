/**
 * Admin Exam Requests List Component
 * For admins to review, approve, reject, and complete exam requests
 */

'use client';

import { useState } from 'react';
import { reviewExamRequest, updateExamRequest } from '@/lib/server/actions/examRequests';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamRequest } from '@/lib/types/examRequest';

interface AdminRequestsListProps {
  requests: ExamRequest[];
  onRequestUpdated?: () => void;
}

export default function AdminRequestsList({ requests, onRequestUpdated }: AdminRequestsListProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function openReviewModal(requestId: string, reviewAction: 'approve' | 'reject') {
    setSelectedRequest(requestId);
    setAction(reviewAction);
    setScheduledDate('');
    setAdminNotes('');
    setRejectionReason('');
    setMessage(null);
  }

  function closeModal() {
    setSelectedRequest(null);
    setAction(null);
    setScheduledDate('');
    setAdminNotes('');
    setRejectionReason('');
  }

  async function handleReview() {
    if (!selectedRequest || !action) return;

    setLoading(true);
    setMessage(null);

    const result = await reviewExamRequest({
      requestId: selectedRequest,
      action,
      scheduledDate: action === 'approve' ? scheduledDate : undefined,
      adminNotes: adminNotes || undefined,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Request updated' });
      if (onRequestUpdated) {
        setTimeout(() => {
          onRequestUpdated();
          closeModal();
        }, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }

    setLoading(false);
  }

  async function handleMarkComplete(requestId: string, result: 'passed' | 'failed') {
    if (!confirm(`Mark this exam as ${result}?`)) return;

    setLoading(true);
    setMessage(null);

    const updateResult = await updateExamRequest({
      requestId,
      examResult: result,
    });

    if (updateResult.success) {
      setMessage({ type: 'success', text: updateResult.message || 'Updated' });
      if (onRequestUpdated) {
        setTimeout(onRequestUpdated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: updateResult.error || 'Failed' });
    }

    setLoading(false);
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
      'scheduled': { bg: 'bg-green-100', text: 'text-green-800' },
      'completed': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'cancelled': { bg: 'bg-gray-100', text: 'text-gray-600' },
    };

    const badge = badges[status] || badges['pending'];
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  function formatDate(isoString?: string): string {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No exam requests to review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {message && !selectedRequest && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{getExamTypeLabel(request.examType)}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Student:</strong> {request.studentName} ({request.studentEmail})
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Submitted:</strong> {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {request.requestedDate && (
                  <p className="text-gray-700">
                    <strong>Preferred Date:</strong> {formatDate(request.requestedDate)}
                  </p>
                )}

                {request.scheduledDate && (
                  <p className="text-gray-700">
                    <strong>Scheduled Date:</strong>{' '}
                    <span className="text-green-600 font-semibold">{formatDate(request.scheduledDate)}</span>
                  </p>
                )}

                {request.notes && (
                  <div className="bg-gray-50 border rounded-md p-3">
                    <strong>Student Notes:</strong>
                    <p className="mt-1">{request.notes}</p>
                  </div>
                )}

                {request.adminNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <strong className="text-blue-900">Admin Notes:</strong>
                    <p className="text-blue-800 mt-1">{request.adminNotes}</p>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <strong className="text-red-900">Rejection Reason:</strong>
                    <p className="text-red-800 mt-1">{request.rejectionReason}</p>
                  </div>
                )}

                {request.examResult && (
                  <p className="text-gray-700">
                    <strong>Result:</strong>{' '}
                    <span className={request.examResult === 'passed' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {request.examResult.toUpperCase()}
                    </span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {request.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => openReviewModal(request.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openReviewModal(request.id, 'reject')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reject
                    </Button>
                  </>
                )}

                {request.status === 'scheduled' && !request.examResult && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleMarkComplete(request.id, 'passed')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Passed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkComplete(request.id, 'failed')}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Mark as Failed
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      {selectedRequest && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>
                {action === 'approve' ? 'Approve Exam Request' : 'Reject Exam Request'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-4">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {action === 'approve' && (
                <div className="space-y-4">
                  <div>
                    <Label>Scheduled Exam Date *</Label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={minDate}
                      required
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Additional information for the student..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {action === 'reject' && (
                <div className="space-y-4">
                  <div>
                    <Label>Rejection Reason *</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      required
                      maxLength={500}
                      placeholder="Explain why this request is being rejected..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Additional information..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={loading || (action === 'approve' && !scheduledDate) || (action === 'reject' && !rejectionReason)}
                  className={`flex-1 ${
                    action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
