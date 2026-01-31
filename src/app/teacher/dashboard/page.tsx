/**
 * Teacher Dashboard Page
 * Shows overview of schedules, students, and quick actions
 * Handles both full timestamps and time-only strings
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

type UpcomingSchedule = {
  id: string;
  lessonType: string;
  startTime: string;
  endTime: string;
  bookedStudents: number;
  maxStudents: number;
  location?: string | null;
};

type TeacherStats = {
  totalSchedules: number;
  upcomingCount: number;
  totalStudentsBooked: number;
  uniqueStudentsCount: number;
  upcomingSchedules: UpcomingSchedule[];
};

/**
 * Parse a date field that could be Timestamp, string, or object with _seconds
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && '_seconds' in value) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

/**
 * Parse a time field - could be full datetime or time-only string
 * If time-only, combine with the provided baseDate
 */
function parseTime(value: unknown, baseDate: Date): Date | null {
  if (!value) return null;
  
  // Full Timestamp
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  
  // Object with _seconds (Firestore timestamp-like)
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  
  // Object with toDate method
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  
  // String - could be ISO or time-only
  if (typeof value === 'string') {
    // Check if it's a full ISO string (contains T or Z or -)
    if (value.includes('T') || value.includes('Z') || value.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Time-only string like '09:00' or '14:30'
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      
      const result = new Date(baseDate);
      result.setHours(hours, minutes, seconds, 0);
      return result;
    }
    
    // Try parsing as-is
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

async function getTeacherStats(teacherId: string): Promise<TeacherStats> {
  try {
    console.log('[Teacher Dashboard] Getting stats for teacher:', teacherId);
    
    const now = new Date();
    console.log('[Teacher Dashboard] Current time:', now.toISOString());

    const schedulesSnapshot = await adminDb
      .collection(COLLECTIONS.SCHEDULES)
      .where('teacherId', '==', teacherId)
      .get();

    console.log('[Teacher Dashboard] Total schedules found:', schedulesSnapshot.size);

    let upcomingCount = 0;
    let totalStudentsBooked = 0;
    const upcomingSchedules: UpcomingSchedule[] = [];

    schedulesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`[Teacher Dashboard] Schedule ${index + 1}:`, {
        id: doc.id,
        lessonType: data.lessonType,
        date: data.date,
        dateType: typeof data.date,
        startTime: data.startTime,
        startTimeType: typeof data.startTime,
      });

      try {
        // Parse the date field first
        const scheduleDate = parseDate(data.date);
        if (!scheduleDate) {
          console.error(`[Teacher Dashboard] Invalid date format for schedule ${doc.id}:`, data.date);
          return;
        }

        // Parse startTime, using scheduleDate as base for time-only strings
        const startDate = parseTime(data.startTime, scheduleDate);
        if (!startDate) {
          console.error(`[Teacher Dashboard] Invalid startTime format for schedule ${doc.id}:`, data.startTime);
          return;
        }

        // Parse endTime, defaulting to 1 hour after start
        let endDate = parseTime(data.endTime, scheduleDate);
        if (!endDate) {
          endDate = new Date(startDate.getTime() + 3600000); // 1 hour default
        }

        // Get booked students count
        const bookedCount = Array.isArray(data.bookedStudents) 
          ? data.bookedStudents.length 
          : (typeof data.bookedStudents === 'number' ? data.bookedStudents : 0);

        console.log(`[Teacher Dashboard] Schedule ${index + 1} parsed:`, {
          scheduleDate: scheduleDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isFuture: startDate > now,
          bookedCount,
        });

        // Check if upcoming
        if (startDate > now) {
          upcomingCount++;
          totalStudentsBooked += bookedCount;
          
          upcomingSchedules.push({
            id: doc.id,
            lessonType: data.lessonType || 'Lesson',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            bookedStudents: bookedCount,
            maxStudents: data.maxStudents || 1,
            location: data.location || null,
          });
        }
      } catch (parseError) {
        console.error(`[Teacher Dashboard] Error parsing schedule ${doc.id}:`, parseError);
      }
    });

    console.log('[Teacher Dashboard] Counts:', { upcomingCount, totalStudentsBooked });

    // Sort upcoming schedules by date
    upcomingSchedules.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Get unique students count
    const bookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('teacherId', '==', teacherId)
      .get();

    const uniqueStudents = new Set<string>();
    bookingsSnapshot.docs.forEach(doc => {
      const studentId = doc.data().studentId;
      if (studentId) {
        uniqueStudents.add(studentId);
      }
    });

    const result = {
      totalSchedules: schedulesSnapshot.size,
      upcomingCount,
      totalStudentsBooked,
      uniqueStudentsCount: uniqueStudents.size,
      upcomingSchedules: upcomingSchedules.slice(0, 5),
    };

    console.log('[Teacher Dashboard] Final result:', result);

    return result;
  } catch (error) {
    console.error('[Teacher Dashboard] Error getting teacher stats:', error);
    return {
      totalSchedules: 0,
      upcomingCount: 0,
      totalStudentsBooked: 0,
      uniqueStudentsCount: 0,
      upcomingSchedules: [],
    };
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export default async function TeacherDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    redirect('/auth/login');
  }

  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
  const userData = userDoc.data();

  const stats = await getTeacherStats(decodedToken.uid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userData?.displayName || 'Teacher'}!
        </h1>
        <p className="text-gray-600 mt-2">Here&apos;s your teaching overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.totalSchedules}</div>
            <div className="text-sm text-gray-600 mt-1">Total Schedules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">{stats.upcomingCount}</div>
            <div className="text-sm text-gray-600 mt-1">Upcoming Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.totalStudentsBooked}</div>
            <div className="text-sm text-gray-600 mt-1">Students Booked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.uniqueStudentsCount}</div>
            <div className="text-sm text-gray-600 mt-1">Total Students</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Lessons ({stats.upcomingCount})</h2>
            {stats.upcomingCount > 0 && (
              <Link href="/teacher/schedules" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All →
              </Link>
            )}
          </div>
          
          {stats.upcomingSchedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <p className="text-gray-600 text-lg mb-2">No upcoming lessons scheduled</p>
              <p className="text-gray-500 text-sm mb-6">Create schedules to start teaching!</p>
              <Link
                href="/teacher/schedules"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Create Schedule
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-lg hover:border-green-200 hover:bg-green-50 transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{schedule.lessonType}</div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <span>{schedule.bookedStudents}/{schedule.maxStudents} students booked</span>
                    </div>
                    {schedule.location && (
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>📍 {schedule.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4 bg-green-50 px-4 py-2 rounded-md">
                    <div className="text-sm font-semibold text-green-900">
                      {formatDate(schedule.startTime)}
                    </div>
                    <div className="text-sm text-green-700 flex items-center gap-1 justify-end mt-1">
                      <span>{formatTimeRange(schedule.startTime, schedule.endTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/teacher/schedules"
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">📅 Manage Schedules</div>
          <div className="text-sm opacity-90">Create and edit your lessons</div>
        </Link>
        <Link
          href="/teacher/students"
          className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">👥 My Students</div>
          <div className="text-sm opacity-90">View student progress</div>
        </Link>
        <Link
          href="/teacher/quizzes"
          className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">📝 Quizzes</div>
          <div className="text-sm opacity-90">Create and manage quizzes</div>
        </Link>
      </div>
    </div>
  );
}
