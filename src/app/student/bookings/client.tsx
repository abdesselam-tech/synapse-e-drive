/**
 * Student Bookings Client Component
 * Handles tabs, client-side interactions, and driving progress display
 * Now includes rank badge and group-scoped availability
 */

'use client';

import { useState, useCallback } from 'react';
import type { PlainBooking, AvailableSchedule } from '@/lib/server/actions/bookings';
import type { StudentProgress } from '@/lib/types/booking';
import type { RankInfo } from '@/lib/types/ranking';
import { getStudentProgressSummary } from '@/lib/server/actions/bookings';
import MyBookings from '@/components/bookings/MyBookings';
import AvailableSchedules from '@/components/bookings/AvailableSchedules';
import StudentScheduleSearch from '@/components/schedules/StudentScheduleSearch';
import DrivingProgressDashboard from '@/components/student/DrivingProgressDashboard';
import { RankBadge, RankProgressBar } from '@/components/ui/RankBadge';
import { Card, CardContent } from '@/components/ui/card';

interface StudentBookingsClientProps {
  initialBookings: PlainBooking[];
  initialAvailableSchedules: AvailableSchedule[];
  upcomingCount: number;
  initialProgress: StudentProgress;
  studentId: string;
  rankInfo: RankInfo | null;
}

export default function StudentBookingsClient({
  initialBookings,
  initialAvailableSchedules,
  upcomingCount,
  initialProgress,
  studentId,
  rankInfo,
}: StudentBookingsClientProps) {
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'available' | 'search'>('my-bookings');
  const [progress, setProgress] = useState<StudentProgress>(initialProgress);
  const [showProgress, setShowProgress] = useState(true);

  const refreshProgress = useCallback(async () => {
    try {
      const updatedProgress = await getStudentProgressSummary(studentId);
      setProgress(updatedProgress);
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* Header with Rank Info */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lessons & Bookings</h1>
          <p className="text-gray-600">
            {upcomingCount > 0 
              ? `You have ${upcomingCount} upcoming ${upcomingCount === 1 ? 'lesson' : 'lessons'}`
              : 'No upcoming lessons scheduled'}
          </p>
        </div>
        
        {/* Rank Badge Card */}
        {rankInfo && rankInfo.groupId && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                <RankBadge 
                  rank={rankInfo.currentRank} 
                  label={rankInfo.currentRankLabel}
                  maxRank={rankInfo.maxRank}
                  showProgress
                />
                {rankInfo.groupName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Groupe:</span> {rankInfo.groupName}
                  </p>
                )}
                {rankInfo.nextRankLabel && (
                  <RankProgressBar
                    currentRank={rankInfo.currentRank}
                    maxRank={rankInfo.maxRank}
                    progressPercent={rankInfo.progressToNextRank || 0}
                    nextRankLabel={rankInfo.nextRankLabel}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Not enrolled message */}
        {(!rankInfo || !rankInfo.groupId) && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                <strong>Non inscrit à un groupe</strong>
                <br />
                Rejoignez un groupe pour accéder aux leçons personnalisées.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Driving Progress Dashboard */}
      <div>
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
        >
          {showProgress ? '▼ Hide Progress' : '▶ Show Progress'}
        </button>
        {showProgress && (
          <DrivingProgressDashboard progress={progress} />
        )}
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
