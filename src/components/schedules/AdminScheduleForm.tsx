/**
 * Admin Schedule Form Component
 * Allows admins to create schedules for any teacher
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminCreateSchedule, getAllTeachers } from '@/lib/server/actions/schedules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Teacher = {
  id: string;
  name: string;
  email: string;
};

interface AdminScheduleFormProps {
  onSuccess?: () => void;
}

const LESSON_TYPES = [
  { value: 'theoretical', label: 'Theory Lesson' },
  { value: 'practical', label: 'Practical Driving' },
  { value: 'exam_prep', label: 'Exam Preparation' },
];

export default function AdminScheduleForm({ onSuccess }: AdminScheduleFormProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [lessonType, setLessonType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxStudents, setMaxStudents] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      const data = await getAllTeachers();
      setTeachers(data);
      if (data.length > 0) {
        setTeacherId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      setMessage({ type: 'error', text: 'Failed to load teachers' });
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Auto-set maxStudents based on lesson type
  useEffect(() => {
    if (lessonType === 'practical') {
      setMaxStudents(1);
    }
  }, [lessonType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (!teacherId || !lessonType || !date || !startTime || !endTime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setMessage({ type: 'error', text: 'End time must be after start time' });
      setLoading(false);
      return;
    }

    try {
      await adminCreateSchedule({
        teacherId,
        lessonType,
        date,
        startTime,
        endTime,
        maxStudents,
        location: location || undefined,
        notes: notes || undefined,
      });

      setMessage({ type: 'success', text: 'Schedule created successfully!' });
      
      // Reset form
      setLessonType('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setMaxStudents(1);
      setLocation('');
      setNotes('');

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (loadingTeachers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Loading teachers...</p>
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="error">
            <AlertDescription>
              No teachers available. Please create teacher accounts first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Teacher *</Label>
            <Select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              className="mt-1"
            >
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Lesson Type *</Label>
            <Select
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value)}
              required
              className="mt-1"
            >
              <option value="">Select lesson type</option>
              {LESSON_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max Students *</Label>
              <Input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                min={1}
                max={20}
                required
                disabled={lessonType === 'practical'}
                className="mt-1"
              />
              {lessonType === 'practical' && (
                <p className="text-xs text-gray-500 mt-1">Practical lessons are 1-on-1</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Location (Optional)</Label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Office, Downtown Branch"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information..."
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Schedule...' : 'Create Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
