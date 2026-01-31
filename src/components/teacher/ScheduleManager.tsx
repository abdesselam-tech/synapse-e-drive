/**
 * Schedule Manager Client Component
 * Handles schedule creation, editing, and deletion
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleForm } from './ScheduleForm';
import { ScheduleCalendar } from './ScheduleCalendar';
import { deleteSchedule, type PlainSchedule } from '@/lib/server/actions/schedules';
import { Plus, Trash2, Edit } from 'lucide-react';
import { format, isAfter, startOfDay, addDays } from 'date-fns';

// Helper to convert ISO string date to Date object
const timestampToDate = (timestamp: string): Date => {
  return new Date(timestamp);
};

interface ScheduleManagerProps {
  schedules: PlainSchedule[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function ScheduleManager({ schedules, onRefresh, isRefreshing }: ScheduleManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PlainSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<PlainSchedule | null>(null);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    onRefresh();
  };

  const handleEditSuccess = () => {
    setEditingSchedule(null);
    onRefresh();
  };

  const handleDelete = async (schedule: PlainSchedule) => {
    if (!confirm(`Are you sure you want to delete this schedule?`)) {
      return;
    }

    try {
      await deleteSchedule(schedule.id);
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete schedule';
      alert(message);
    }
  };

  // Calculate statistics
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);

  const upcomingSchedules = schedules.filter((schedule) => {
    const scheduleDate = timestampToDate(schedule.date);
    return isAfter(scheduleDate, today) && scheduleDate <= nextWeek;
  });

  const availableSchedules = schedules.filter((s) => s.status === 'available');
  const bookedSchedules = schedules.filter((s) => s.status === 'booked');
  const thisMonthSchedules = schedules.filter((schedule) => {
    const scheduleDate = timestampToDate(schedule.date);
    return scheduleDate.getMonth() === today.getMonth() && scheduleDate.getFullYear() === today.getFullYear();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Manage your lesson schedules</p>
          {isRefreshing && <p className="text-xs text-muted-foreground">Refreshing...</p>}
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={isRefreshing}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Schedule
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">{thisMonthSchedules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-2xl">{availableSchedules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Booked</CardDescription>
            <CardTitle className="text-2xl">{bookedSchedules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming (7 days)</CardDescription>
            <CardTitle className="text-2xl">{upcomingSchedules.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingSchedule) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {showCreateForm ? 'Create New Schedule' : 'Edit Schedule'}
            </CardTitle>
            <CardDescription>
              {showCreateForm
                ? 'Fill in the details to create a new schedule slot'
                : 'Update the schedule details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleForm
              mode={showCreateForm ? 'create' : 'edit'}
              initialData={editingSchedule || undefined}
              onSuccess={showCreateForm ? handleCreateSuccess : handleEditSuccess}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingSchedule(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Click on a schedule to view details or edit</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleCalendar
            schedules={schedules}
            onScheduleClick={setSelectedSchedule}
            onTimeSlotClick={(date, time) => {
              void date;
              void time;
              // Create new schedule at this time slot
              setShowCreateForm(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Upcoming Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedules (Next 7 Days)</CardTitle>
          <CardDescription>Your scheduled lessons for the week</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming schedules in the next 7 days
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingSchedules.map((schedule) => {
                const scheduleDate = timestampToDate(schedule.date);
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {format(scheduleDate, 'EEEE, MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.startTime} - {schedule.endTime} • {schedule.lessonType} •{' '}
                        {schedule.bookedStudents.length}/{schedule.maxStudents} students
                      </div>
                      {schedule.location && (
                        <div className="text-sm text-muted-foreground">📍 {schedule.location}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSchedule(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(schedule)}
                        disabled={schedule.bookedStudents.length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details Modal */}
      {selectedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSchedule(null)}
              className="absolute top-4 right-4"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Date:</strong>{' '}
                {format(timestampToDate(selectedSchedule.date), 'EEEE, MMM d, yyyy')}
              </div>
              <div>
                <strong>Time:</strong> {selectedSchedule.startTime} - {selectedSchedule.endTime}
              </div>
              <div>
                <strong>Type:</strong> {selectedSchedule.lessonType}
              </div>
              <div>
                <strong>Students:</strong> {selectedSchedule.bookedStudents.length}/
                {selectedSchedule.maxStudents}
              </div>
              <div>
                <strong>Status:</strong> {selectedSchedule.status}
              </div>
              {selectedSchedule.location && (
                <div>
                  <strong>Location:</strong> {selectedSchedule.location}
                </div>
              )}
              {selectedSchedule.notes && (
                <div>
                  <strong>Notes:</strong> {selectedSchedule.notes}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setEditingSchedule(selectedSchedule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedSchedule)}
                  disabled={selectedSchedule.bookedStudents.length > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
