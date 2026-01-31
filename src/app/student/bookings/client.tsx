/**
 * Student Bookings Client Component
 * Handles tabs and client-side interactions
 */

'use client';

import { useState } from 'react';
import type { PlainBooking, AvailableSchedule } from '@/lib/server/actions/bookings';
import MyBookings from '@/components/bookings/MyBookings';
import AvailableSchedules from '@/components/bookings/AvailableSchedules';
import StudentScheduleSearch from '@/components/schedules/StudentScheduleSearch';

interface StudentBookingsClientProps {
  initialBookings: PlainBooking[];
  initialAvailableSchedules: AvailableSchedule[];
  upcomingCount: number;
}

export default function StudentBookingsClient({
  initialBookings,
  initialAvailableSchedules,
  upcomingCount,
}: StudentBookingsClientProps) {
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'available' | 'search'>('my-bookings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lessons & Bookings</h1>
        <p className="text-gray-600">
          {upcomingCount > 0 
            ? `You have ${upcomingCount} upcoming ${upcomingCount === 1 ? 'lesson' : 'lessons'}`
            : 'No upcoming lessons scheduled'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my-bookings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 My Bookings ({initialBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ✅ Available ({initialAvailableSchedules.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'search'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔍 Search & Filter
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-bookings' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
          <MyBookings bookings={initialBookings} />
        </div>
      )}

      {activeTab === 'available' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Available Lessons</h2>
          <p className="text-sm text-gray-600 mb-4">
            Book lessons at least 2 hours before start time
          </p>
          <AvailableSchedules schedules={initialAvailableSchedules} />
        </div>
      )}

      {activeTab === 'search' && (
        <StudentScheduleSearch />
      )}
    </div>
  );
}
