/**
 * Teacher Bookings List Component
 * Displays teacher's bookings with notes management and lesson completion
 */

'use client';

import { useState } from 'react';
import TeacherNotesEditor from './TeacherNotesEditor';
import LessonCompletionForm from './LessonCompletionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TeacherBookingWithNotes } from '@/lib/server/actions/bookings';

interface TeacherBookingsListProps {
  bookings: TeacherBookingWithNotes[];
  onNotesUpdated?: () => void;
}

export default function TeacherBookingsList({ 
  bookings,
  onNotesUpdated 
}: TeacherBookingsListProps) {
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [completingBooking, setCompletingBooking] = useState<TeacherBookingWithNotes | null>(null);

  function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function handleCompletionSuccess() {
    setCompletingBooking(null);
    if (onNotesUpdated) {
      onNotesUpdated();
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            No confirmed bookings found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Lesson Completion Modal */}
      {completingBooking && (
        <LessonCompletionForm
          booking={{
            id: completingBooking.id,
            studentName: completingBooking.studentName,
            lessonType: completingBooking.lessonType,
            date: completingBooking.date,
            startTime: completingBooking.startTime,
          }}
          onSuccess={handleCompletionSuccess}
          onCancel={() => setCompletingBooking(null)}
        />
      )}

      <div className="space-y-3">
        {bookings.map((booking) => {
          const isExpanded = expandedBooking === booking.id;
          const isPast = new Date(booking.startTime) < new Date();
          const isCompleted = booking.status === 'completed' || booking.completed === true;
          const canComplete = isPast && !isCompleted && booking.status === 'confirmed';
          
          return (
            <Card key={booking.id} className={isPast ? 'bg-gray-50' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{booking.studentName}</div>
                    <div className="text-sm text-gray-600">{booking.studentEmail}</div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div>📅 {formatDate(booking.startTime)}</div>
                      <div>🕐 {formatDateTime(booking.startTime)}</div>
                      <div>📚 {booking.lessonType}</div>
                      {booking.location && <div>📍 {booking.location}</div>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isCompleted && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        ✓ Completed
                      </span>
                    )}
                    {isPast && !isCompleted && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        Needs Completion
                      </span>
                    )}
                    {!isPast && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        Upcoming
                      </span>
                    )}
                    
                    <div className="flex gap-2">
                      {canComplete && (
                        <Button
                          size="sm"
                          onClick={() => setCompletingBooking(booking)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete Lesson
                        </Button>
                      )}
                      <button
                        onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {isExpanded ? 'Hide Details' : 'Manage Notes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick preview of notes when collapsed */}
                {!isExpanded && (booking.teacherNotes || booking.studentNotes) && (
                  <div className="flex gap-2 mt-2">
                    {booking.studentNotes && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Has student notes
                      </span>
                    )}
                    {booking.teacherNotes && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        Has teacher notes
                      </span>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t mt-3">
                    {/* Student Notes (Read-only for teacher) */}
                    {booking.studentNotes && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="font-semibold text-gray-900 text-sm mb-1">Student Notes:</div>
                        <div className="text-gray-700 text-sm whitespace-pre-wrap">{booking.studentNotes}</div>
                      </div>
                    )}

                    {/* Teacher Notes (Editable) */}
                    <TeacherNotesEditor
                      bookingId={booking.id}
                      initialNotes={booking.teacherNotes}
                      onSaved={onNotesUpdated}
                    />

                    {booking.teacherNotesUpdatedAt && (
                      <div className="text-xs text-gray-500">
                        Notes last updated: {new Date(booking.teacherNotesUpdatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
