/**
 * Student Schedule Search Component
 * Allows students to search and filter available schedules
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchAvailableSchedules, getUniqueLessonTypes, getUniqueLocations, type PlainSchedule } from '@/lib/server/actions/schedules';
import { createBooking } from '@/lib/server/actions/bookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StudentScheduleSearch() {
  const [schedules, setSchedules] = useState<PlainSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonTypes, setLessonTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Filters
  const [teacherName, setTeacherName] = useState('');
  const [lessonType, setLessonType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [location, setLocation] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);

  // Booking state
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchAvailableSchedules({
        teacherName: teacherName || undefined,
        lessonType: lessonType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        location: location || undefined,
        availableOnly,
      });
      setSchedules(results);
    } catch (error) {
      console.error('Error searching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherName, lessonType, dateFrom, dateTo, location, availableOnly]);

  useEffect(() => {
    loadFilterOptions();
    handleSearch();
  }, []);

  async function loadFilterOptions() {
    const [types, locs] = await Promise.all([
      getUniqueLessonTypes(),
      getUniqueLocations(),
    ]);
    setLessonTypes(types);
    setLocations(locs);
  }

  function handleClearFilters() {
    setTeacherName('');
    setLessonType('');
    setDateFrom('');
    setDateTo('');
    setLocation('');
    setAvailableOnly(true);
  }

  async function handleBook(scheduleId: string) {
    setBookingLoading(true);
    setMessage(null);

    const result = await createBooking({ scheduleId, notes: bookingNotes });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Booking confirmed!' });
      setSelectedSchedule(null);
      setBookingNotes('');
      
      // Refresh results after booking
      setTimeout(() => {
        handleSearch();
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to book' });
    }

    setBookingLoading(false);
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Search/Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Teacher Name Search */}
            <div>
              <Label htmlFor="teacherName">Teacher Name</Label>
              <Input
                id="teacherName"
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Search by teacher..."
              />
            </div>

            {/* Lesson Type Filter */}
            <div>
              <Label htmlFor="lessonType">Lesson Type</Label>
              <select
                id="lessonType"
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value)}
                className="w-full h-10 px-3 border rounded-md text-sm"
              >
                <option value="">All Types</option>
                {lessonTypes.map(type => (
                  <option key={type} value={type}>{getLessonTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-10 px-3 border rounded-md text-sm"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                min={today}
              />
            </div>

            {/* Date To */}
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || today}
              />
            </div>

            {/* Available Only Checkbox */}
            <div className="flex items-center pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium">Show only available</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleClearFilters();
                setTimeout(handleSearch, 100);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results ({schedules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">🔍</div>
              <p className="text-gray-600 text-lg mb-2">No schedules found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="hover:shadow-md transition border">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {getLessonTypeLabel(schedule.lessonType)}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${getLessonTypeColor(schedule.lessonType)}`}>
                        {schedule.bookedStudents?.length || 0}/{schedule.maxStudents} booked
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
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBook(schedule.id)}
                            disabled={bookingLoading}
                            className="flex-1"
                          >
                            {bookingLoading ? 'Booking...' : 'Confirm'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedSchedule(null);
                              setBookingNotes('');
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
