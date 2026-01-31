/**
 * Admin Group Form Component
 * For creating new groups
 */

'use client';

import { useState, useEffect } from 'react';
import { createGroup } from '@/lib/server/actions/groups';
import { getAllTeachers } from '@/lib/server/actions/schedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminGroupFormProps {
  onSuccess?: () => void;
}

export default function AdminGroupForm({ onSuccess }: AdminGroupFormProps) {
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [maxStudents, setMaxStudents] = useState(10);
  const [schedule, setSchedule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createGroup({
      name,
      description,
      teacherId,
      maxStudents,
      schedule: schedule || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Group created!' });
      // Reset form
      setName('');
      setDescription('');
      setTeacherId('');
      setMaxStudents(10);
      setSchedule('');
      setStartDate('');
      setEndDate('');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create group' });
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Theory Class A"
                required
                minLength={3}
              />
            </div>

            <div>
              <Label htmlFor="teacherId">Assigned Teacher *</Label>
              <select
                id="teacherId"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="maxStudents">Max Students *</Label>
              <Input
                id="maxStudents"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value) || 1)}
                min={1}
                max={50}
                required
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule (optional)</Label>
              <Input
                id="schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g., Mon/Wed 10:00-12:00"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date (optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this group is for..."
              rows={3}
              required
              minLength={10}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
