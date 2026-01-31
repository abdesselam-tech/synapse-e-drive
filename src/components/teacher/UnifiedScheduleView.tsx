'use client';

import { useState, useMemo } from 'react';
import type { CombinedScheduleItem } from '@/lib/server/actions/schedules';

interface UnifiedScheduleViewProps {
  schedules: CombinedScheduleItem[];
  onRefresh: () => void;
}

type FilterType = 'all' | 'individual' | 'group' | 'upcoming' | 'past';

export default function UnifiedScheduleView({ schedules, onRefresh }: UnifiedScheduleViewProps) {
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const now = useMemo(() => new Date(), []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      
      switch (filter) {
        case 'upcoming':
          return scheduleDate >= now;
        case 'past':
          return scheduleDate < now;
        case 'individual':
          return schedule.scheduleType === 'individual';
        case 'group':
          return schedule.scheduleType === 'group';
        default:
          return true;
      }
    });
  }, [schedules, filter, now]);

  const stats = useMemo(() => ({
    total: schedules.length,
    individual: schedules.filter(s => s.scheduleType === 'individual').length,
    group: schedules.filter(s => s.scheduleType === 'group').length,
    upcoming: schedules.filter(s => new Date(s.date) >= now).length,
    past: schedules.filter(s => new Date(s.date) < now).length,
  }), [schedules, now]);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }

  function formatTime(time: string): string {
    if (!time) return '';
    // If already in HH:MM format, return as-is
    if (/^\d{2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    // Try to parse as date
    try {
      return new Date(time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return time;
    }
  }

  function isUpcoming(dateString: string): boolean {
    return new Date(dateString) >= now;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Schedules</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.individual}</div>
          <div className="text-sm text-gray-600">Individual Lessons</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.group}</div>
          <div className="text-sm text-gray-600">Group Sessions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
          { key: 'past', label: 'Past', count: stats.past },
          { key: 'individual', label: '👤 Individual', count: stats.individual },
          { key: 'group', label: '👥 Group', count: stats.group },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500 text-lg">No schedules found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'upcoming' 
              ? 'You have no upcoming lessons or group sessions'
              : filter === 'past'
              ? 'No past schedules to show'
              : 'Try adjusting your filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => (
            <div
              key={`${schedule.scheduleType}-${schedule.id}`}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-4 hover:shadow-md transition-shadow ${
                schedule.scheduleType === 'individual'
                  ? 'border-l-blue-500'
                  : 'border-l-green-500'
              } ${!isUpcoming(schedule.date) ? 'opacity-75' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                {/* Left side - Main content */}
                <div className="flex-1">
                  {/* Type badge and group name */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      schedule.scheduleType === 'individual'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {schedule.scheduleType === 'individual' ? '👤 Individual' : '👥 Group'}
                    </span>
                    
                    {schedule.scheduleType === 'group' && schedule.groupName && (
                      <span className="text-sm font-medium text-gray-700">
                        {schedule.groupName}
                      </span>
                    )}
                    
                    {!isUpcoming(schedule.date) && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {schedule.scheduleType === 'individual' 
                      ? schedule.lessonType 
                      : schedule.topic || 'Group Session'}
                  </h3>

                  {/* Schedule details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span className="font-medium">{formatDate(schedule.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🕐</span>
                      <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                    </div>
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span>{schedule.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {schedule.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      📝 {schedule.notes}
                    </div>
                  )}
                </div>

                {/* Right side - Status badges and actions */}
                <div className="flex flex-col items-end gap-2">
                  {/* Booking status for individual */}
                  {schedule.scheduleType === 'individual' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (schedule.bookedStudents || 0) >= (schedule.maxStudents || 1)
                        ? 'bg-red-100 text-red-800'
                        : (schedule.bookedStudents || 0) > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {schedule.bookedStudents || 0}/{schedule.maxStudents || 1} booked
                    </span>
                  )}

                  {/* Attendance required for group */}
                  {schedule.scheduleType === 'group' && schedule.attendanceRequired && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ Attendance Required
                    </span>
                  )}

                  {/* Action links */}
                  <div className="flex gap-3 mt-2">
                    {schedule.scheduleType === 'individual' ? (
                      <>
                        <a
                          href={`/teacher/bookings?scheduleId=${schedule.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Bookings →
                        </a>
                      </>
                    ) : (
                      <a
                        href={`/teacher/groups/${schedule.groupId}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Group →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-l-4 border-blue-500 bg-blue-50"></div>
          <span>Individual Lesson</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-l-4 border-green-500 bg-green-50"></div>
          <span>Group Session</span>
        </div>
      </div>
    </div>
  );
}
