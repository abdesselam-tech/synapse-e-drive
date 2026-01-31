/**
 * Available Schedules Component
 * Displays available lessons for students to book
 */

'use client';

import { useState } from 'react';
import { createBooking, type AvailableSchedule } from '@/lib/server/actions/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AvailableSchedulesProps {
  schedules: AvailableSchedule[];
}

export default function AvailableSchedules({ schedules }: AvailableSchedulesProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleBook(scheduleId: string) {
    setLoading(true);
    setMessage(null);

    const result = await createBooking({ scheduleId, notes });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Booking confirmed!' });
      setSelectedSchedule(null);
      setNotes('');
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to book' });
    }

    setLoading(false);
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getLessonTypeLabel(type: string) {
    const labels: Record<string, string> = {
      theoretical: 'Theory Lesson',
      practical: 'Practical Lesson',
      exam_prep: 'Exam Preparation',
    };
    return labels[type] || type;
  }

  function getLessonTypeColor(type: string) {
    const colors: Record<string, string> = {
      theoretical: 'bg-blue-100 text-blue-800',
      practical: 'bg-green-100 text-green-800',
      exam_prep: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No available schedules at the moment.</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new lesson times.</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {getLessonTypeLabel(schedule.lessonType)}
                </CardTitle>
                <span className={`text-xs px-2 py-1 rounded ${getLessonTypeColor(schedule.lessonType)}`}>
                  {schedule.bookedStudents}/{schedule.maxStudents} booked
                </span>
              </div>
              <p className="text-sm text-gray-600">Teacher: {schedule.teacherName}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2">
                  <span>📅</span> {formatDate(schedule.date)}
                </p>
                <p className="flex items-center gap-2">
                  <span>🕐</span> {schedule.startTime} - {schedule.endTime}
                </p>
                {schedule.location && (
                  <p className="flex items-center gap-2">
                    <span>📍</span> {schedule.location}
                  </p>
                )}
              </div>

              {selectedSchedule === schedule.id ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBook(schedule.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSchedule(null);
                        setNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setSelectedSchedule(schedule.id)}
                  className="w-full"
                >
                  Book This Lesson
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
