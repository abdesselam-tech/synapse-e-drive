/**
 * Teacher Bookings Page
 * Manage student bookings and add notes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTeacherBookingsWithNotes, type TeacherBookingWithNotes } from '@/lib/server/actions/bookings';
import TeacherBookingsList from '@/components/bookings/TeacherBookingsList';
import { Card, CardContent } from '@/components/ui/card';

type FilterType = 'all' | 'upcoming' | 'past';

export default function TeacherBookingsPage() {
  const [bookings, setBookings] = useState<TeacherBookingWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get current user ID from API
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      const { uid } = await response.json();

      const data = await getTeacherBookingsWithNotes(uid);
      setBookings(data);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const now = new Date();
  
  const upcomingBookings = bookings.filter(b => new Date(b.startTime) > now);
  const pastBookings = bookings.filter(b => new Date(b.startTime) <= now);
  
  const filteredBookings = filter === 'all' 
    ? bookings 
    : filter === 'upcoming' 
      ? upcomingBookings 
      : pastBookings;

  // Count bookings with teacher notes
  const withNotesCount = bookings.filter(b => b.teacherNotes).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Bookings</h1>
        <p className="text-gray-600">Manage your student bookings and add notes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{upcomingBookings.length}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{pastBookings.length}</div>
            <div className="text-sm text-gray-600">Past</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{withNotesCount}</div>
            <div className="text-sm text-gray-600">With Notes</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'upcoming'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'past'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      ) : (
        <TeacherBookingsList 
          bookings={filteredBookings}
          onNotesUpdated={loadBookings}
        />
      )}
    </div>
  );
}
