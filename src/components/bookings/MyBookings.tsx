/**
 * My Bookings Component
 * Displays student's bookings with cancellation functionality
 */

'use client';

import { useState } from 'react';
import { cancelBooking, type PlainBooking } from '@/lib/server/actions/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MyBookingsProps {
  bookings: PlainBooking[];
}

export default function MyBookings({ bookings }: MyBookingsProps) {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleCancel(bookingId: string) {
    setLoading(true);
    setMessage(null);

    const result = await cancelBooking({ bookingId, reason });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Booking cancelled!' });
      setSelectedBooking(null);
      setReason('');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to cancel' });
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

  function canCancel(dateISO: string, startTime: string): boolean {
    const now = new Date();
    const lessonDate = new Date(dateISO);
    const [hours, minutes] = startTime.split(':').map(Number);
    lessonDate.setHours(hours, minutes, 0, 0);
    const hoursDiff = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 2;
  }

  function isUpcoming(dateISO: string, startTime: string): boolean {
    const now = new Date();
    const lessonDate = new Date(dateISO);
    const [hours, minutes] = startTime.split(':').map(Number);
    lessonDate.setHours(hours, minutes, 0, 0);
    return lessonDate > now;
  }

  function getLessonTypeLabel(type: string) {
    const labels: Record<string, string> = {
      theoretical: 'Theory Lesson',
      practical: 'Practical Lesson',
      exam_prep: 'Exam Preparation',
    };
    return labels[type] || type;
  }

  const upcoming = bookings.filter(
    b => b.status === 'confirmed' && isUpcoming(b.date, b.startTime)
  );
  const past = bookings.filter(
    b => b.status !== 'confirmed' || !isUpcoming(b.date, b.startTime)
  );

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">You have no bookings yet.</p>
          <p className="text-sm text-gray-400 mt-2">Book your first lesson to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Lessons</h3>
          <div className="space-y-4">
            {upcoming.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {getLessonTypeLabel(booking.lessonType)}
                    </CardTitle>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Teacher: {booking.teacherName}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center gap-2">
                      <span>📅</span> {formatDate(booking.date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🕐</span> {booking.startTime} - {booking.endTime}
                    </p>
                    {booking.location && (
                      <p className="flex items-center gap-2">
                        <span>📍</span> {booking.location}
                      </p>
                    )}
                  </div>

                  {/* Student's own notes */}
                  {booking.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
                      <div className="font-semibold text-gray-900 text-sm mb-1">Your Notes:</div>
                      <div className="text-gray-700 text-sm">{booking.notes}</div>
                    </div>
                  )}

                  {/* Teacher notes */}
                  {booking.teacherNotes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600 text-lg">👨‍🏫</span>
                        <div className="font-semibold text-blue-900 text-sm">Teacher Notes:</div>
                      </div>
                      <div className="text-blue-800 text-sm whitespace-pre-wrap">{booking.teacherNotes}</div>
                      {booking.teacherNotesUpdatedAt && (
                        <div className="text-xs text-blue-600 mt-2">
                          Updated: {new Date(booking.teacherNotesUpdatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {canCancel(booking.date, booking.startTime) ? (
                    selectedBooking === booking.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Reason for cancellation (optional)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancel(booking.id)}
                            disabled={loading}
                            className="flex-1"
                          >
                            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedBooking(null);
                              setReason('');
                            }}
                          >
                            Keep Booking
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBooking(booking.id)}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Cancel Booking
                      </Button>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 italic text-center py-2">
                      Cannot cancel (less than 2 hours before lesson)
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past & Cancelled</h3>
          <div className="space-y-4">
            {past.map((booking) => (
              <Card key={booking.id} className="bg-gray-50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-700">
                      {getLessonTypeLabel(booking.lessonType)}
                    </CardTitle>
                    <span className={`text-xs px-2 py-1 rounded ${
                      booking.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800' 
                        : booking.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status === 'cancelled' ? 'Cancelled' : 
                       booking.status === 'completed' ? 'Completed' : 'Past'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Teacher: {booking.teacherName}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-500 mb-3">
                    <p className="flex items-center gap-2">
                      <span>📅</span> {formatDate(booking.date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🕐</span> {booking.startTime} - {booking.endTime}
                    </p>
                    {booking.location && (
                      <p className="flex items-center gap-2">
                        <span>📍</span> {booking.location}
                      </p>
                    )}
                    {booking.cancellationReason && (
                      <p className="italic">Cancellation reason: {booking.cancellationReason}</p>
                    )}
                  </div>

                  {/* Teacher notes for past bookings */}
                  {booking.teacherNotes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600 text-lg">👨‍🏫</span>
                        <div className="font-semibold text-blue-900 text-sm">Teacher Notes:</div>
                      </div>
                      <div className="text-blue-800 text-sm whitespace-pre-wrap">{booking.teacherNotes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
