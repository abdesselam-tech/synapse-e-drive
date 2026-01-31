/**
 * Admin Schedules Page
 * View and manage all schedules across all teachers
 * With create form, details modal, and advanced filtering
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminGetAllSchedules, type PlainSchedule } from '@/lib/server/actions/schedules';
import AdminScheduleForm from '@/components/schedules/AdminScheduleForm';
import AdminScheduleDetails from '@/components/schedules/AdminScheduleDetails';
import AdminScheduleFilter from '@/components/schedules/AdminScheduleFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Parse date field to get proper Date object
 */
function parseScheduleDate(dateValue: string): Date {
  return new Date(dateValue);
}

/**
 * Format time for display - handles both ISO strings and time-only strings
 */
function formatTime(timeString: string): string {
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

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<PlainSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<PlainSchedule[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetAllSchedules();
      setSchedules(data);
      // Clear filter when reloading
      setIsFiltered(false);
      setFilteredSchedules([]);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleFilteredSchedules = useCallback((filtered: PlainSchedule[]) => {
    setFilteredSchedules(filtered);
    setIsFiltered(true);
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilteredSchedules([]);
    setIsFiltered(false);
  }, []);

  // Use filtered schedules if filters are applied
  const displaySchedules = isFiltered ? filteredSchedules : schedules;

  // Calculate stats based on display schedules
  const now = new Date();
  const statsSource = displaySchedules;
  const stats = {
    total: statsSource.length,
    upcoming: statsSource.filter(s => {
      const scheduleDate = parseScheduleDate(s.date);
      return scheduleDate > now;
    }).length,
    available: statsSource.filter(s => {
      const bookedCount = Array.isArray(s.bookedStudents) ? s.bookedStudents.length : 0;
      return bookedCount < s.maxStudents;
    }).length,
    fullyBooked: statsSource.filter(s => {
      const bookedCount = Array.isArray(s.bookedStudents) ? s.bookedStudents.length : 0;
      return bookedCount >= s.maxStudents;
    }).length,
  };

  function getBookedCount(schedule: PlainSchedule): number {
    return Array.isArray(schedule.bookedStudents) ? schedule.bookedStudents.length : 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Schedules</h1>
          <p className="text-gray-600">View and manage all teacher schedules across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Hide Form' : 'Create Schedule'}
          </Button>
        </div>
      </div>

      {/* Filter UI */}
      {showFilters && (
        <div className="space-y-2">
          <AdminScheduleFilter onFilteredSchedules={handleFilteredSchedules} />
          {isFiltered && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredSchedules.length} filtered results
              </span>
              <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                Clear Filter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <AdminScheduleForm 
          onSuccess={() => {
            loadSchedules();
            setShowCreateForm(false);
          }} 
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Schedules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.fullyBooked}</div>
            <div className="text-sm text-gray-600">Fully Booked</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading schedules...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displaySchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {isFiltered 
                      ? 'No schedules match your filters. Try adjusting the criteria.'
                      : 'No schedules found. Create one to get started.'}
                  </td>
                </tr>
              ) : (
                displaySchedules.map((schedule) => {
                  const bookedCount = getBookedCount(schedule);
                  const isFull = bookedCount >= schedule.maxStudents;
                  const scheduleDate = parseScheduleDate(schedule.date);
                  const isPast = scheduleDate < now;
                  
                  return (
                    <tr key={schedule.id} className={`hover:bg-gray-50 ${isPast ? 'bg-gray-50 opacity-75' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{schedule.teacherName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{schedule.lessonType.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(schedule.date)}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
                          {bookedCount}/{schedule.maxStudents}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isPast
                            ? 'bg-gray-100 text-gray-800'
                            : isFull
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isPast ? 'Past' : isFull ? 'Full' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedScheduleId(schedule.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Details Modal */}
      {selectedScheduleId && (
        <AdminScheduleDetails
          scheduleId={selectedScheduleId}
          onClose={() => setSelectedScheduleId(null)}
          onDeleted={loadSchedules}
        />
      )}
    </div>
  );
}
