/**
 * Admin Schedule Details Modal
 * Shows full schedule details with booked students
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminGetScheduleDetails, adminDeleteSchedule } from '@/lib/server/actions/schedules';
import { Button } from '@/components/ui/button';
import type { PlainSchedule } from '@/lib/server/actions/schedules';

type ScheduleDetails = {
  schedule: PlainSchedule;
  students: Array<{
    bookingId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    bookedAt: string;
    status: string;
    notes: string | null;
  }>;
};

interface AdminScheduleDetailsProps {
  scheduleId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function AdminScheduleDetails({ 
  scheduleId, 
  onClose,
  onDeleted 
}: AdminScheduleDetailsProps) {
  const [details, setDetails] = useState<ScheduleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    try {
      const data = await adminGetScheduleDetails(scheduleId);
      setDetails(data);
      setError(null);
    } catch (err) {
      console.error('Error loading schedule details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule details');
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this schedule? All bookings will be cancelled.')) {
      return;
    }

    setDeleting(true);
    try {
      await adminDeleteSchedule(scheduleId);
      alert('Schedule deleted successfully');
      if (onDeleted) onDeleted();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(timeString: string): string {
    // Handle both ISO strings and time-only strings
    if (timeString.includes('T') || timeString.includes('Z')) {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // Time-only string like '09:00'
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading schedule details...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">{error || 'Failed to load schedule details'}</p>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const schedule = details.schedule;
  const bookedCount = Array.isArray(schedule.bookedStudents) 
    ? schedule.bookedStudents.length 
    : (typeof schedule.bookedStudents === 'number' ? schedule.bookedStudents : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Schedule Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Schedule Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Teacher</div>
              <div className="font-semibold">{schedule.teacherName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Lesson Type</div>
              <div className="font-semibold capitalize">{schedule.lessonType.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Date</div>
              <div className="font-semibold">{formatDate(schedule.date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time</div>
              <div className="font-semibold">
                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Capacity</div>
              <div className="font-semibold">
                {bookedCount}/{schedule.maxStudents} students
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="font-semibold">{schedule.location || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                schedule.status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : schedule.status === 'booked'
                  ? 'bg-blue-100 text-blue-800'
                  : schedule.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {schedule.status}
              </span>
            </div>
          </div>
          {schedule.notes && (
            <div className="mt-4">
              <div className="text-sm text-gray-600">Notes</div>
              <div className="mt-1 bg-white p-2 rounded">{schedule.notes}</div>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Booked Students ({details.students.length})
          </h3>
          {details.students.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              No students booked yet
            </div>
          ) : (
            <div className="space-y-2">
              {details.students.map((student) => (
                <div key={student.bookingId} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{student.studentName}</div>
                      <div className="text-sm text-gray-600">{student.studentEmail}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Booked on {formatDateTime(student.bookedAt)}
                      </div>
                      {student.notes && (
                        <div className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                          <strong>Notes:</strong> {student.notes}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      student.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : student.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? 'Deleting...' : 'Delete Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}
