/**
 * Group Schedules List Component
 * Displays group schedules with management options
 */

'use client';

import { useState } from 'react';
import { createGroupSchedule, deleteGroupSchedule } from '@/lib/server/actions/groups';
import type { GroupSchedule } from '@/lib/types/group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GroupSchedulesListProps {
  schedules: GroupSchedule[];
  groupId: string;
  onUpdated?: () => void;
  canManage?: boolean;
}

export default function GroupSchedulesList({ 
  schedules, 
  groupId, 
  onUpdated,
  canManage = true 
}: GroupSchedulesListProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [topic, setTopic] = useState('');
  const [lessonType, setLessonType] = useState('lecture');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [attendanceRequired, setAttendanceRequired] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createGroupSchedule({
      groupId,
      topic,
      lessonType,
      date,
      startTime,
      endTime,
      location: location || undefined,
      notes: notes || undefined,
      attendanceRequired,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Schedule created!' });
      setShowForm(false);
      resetForm();
      if (onUpdated) onUpdated();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create schedule' });
    }

    setLoading(false);
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm('Delete this schedule?')) return;

    setDeleting(scheduleId);
    const result = await deleteGroupSchedule(scheduleId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Schedule deleted' });
      if (onUpdated) onUpdated();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' });
    }

    setDeleting(null);
  }

  function resetForm() {
    setTopic('');
    setLessonType('lecture');
    setDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setNotes('');
    setAttendanceRequired(false);
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const upcomingSchedules = schedules.filter(s => new Date(s.date) >= now);
  const pastSchedules = schedules.filter(s => new Date(s.date) < now);

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {canManage && (
        <div>
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="mb-4">
            {showForm ? 'Cancel' : '+ Create Schedule'}
          </Button>

          {showForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">New Group Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What will be covered?"
                        required
                        minLength={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lessonType">Type</Label>
                      <select
                        id="lessonType"
                        value={lessonType}
                        onChange={(e) => setLessonType(e.target.value)}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        <option value="lecture">Lecture</option>
                        <option value="practical">Practical</option>
                        <option value="exam">Exam</option>
                        <option value="review">Review</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={today}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Room 101"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceRequired}
                          onChange={(e) => setAttendanceRequired(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Attendance Required</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Schedules */}
      {upcomingSchedules.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Upcoming ({upcomingSchedules.length})</h3>
          <div className="space-y-2">
            {upcomingSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{schedule.topic}</div>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <div>📅 {formatDate(schedule.date)} • {schedule.startTime} - {schedule.endTime}</div>
                        <div>📚 {schedule.lessonType}</div>
                        {schedule.location && <div>📍 {schedule.location}</div>}
                        {schedule.attendanceRequired && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Attendance Required
                          </span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deleting === schedule.id}
                        className="text-red-600 hover:bg-red-50"
                      >
                        {deleting === schedule.id ? '...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Schedules */}
      {pastSchedules.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-gray-500">Past ({pastSchedules.length})</h3>
          <div className="space-y-2 opacity-75">
            {pastSchedules.slice(0, 5).map((schedule) => (
              <Card key={schedule.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="font-medium text-gray-700">{schedule.topic}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(schedule.date)} • {schedule.startTime} - {schedule.endTime}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {schedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📅</div>
            <p className="text-gray-600">No schedules yet</p>
            {canManage && (
              <p className="text-sm text-gray-500 mt-2">Create the first schedule for this group</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
