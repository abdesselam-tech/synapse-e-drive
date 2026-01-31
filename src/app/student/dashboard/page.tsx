/**
 * Student Dashboard Page
 * Shows overview of upcoming lessons, quiz stats, and quick actions
 * Handles both full timestamps and time-only strings
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

type UpcomingBooking = {
  id: string;
  lessonType: string;
  teacherName: string;
  startTime: string;
  location?: string | null;
};

type StudentStats = {
  upcomingCount: number;
  completedCount: number;
  totalAttempts: number;
  passedAttempts: number;
  upcomingBookings: UpcomingBooking[];
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

async function getStudentStats(studentId: string): Promise<StudentStats> {
  try {
    console.log('[Student Dashboard] Getting stats for student:', studentId);
    
    const now = new Date();
    console.log('[Student Dashboard] Current time:', now.toISOString());

    const bookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('studentId', '==', studentId)
      .get();

    console.log('[Student Dashboard] Total bookings found:', bookingsSnapshot.size);

    let upcomingCount = 0;
    let completedCount = 0;
    const upcomingBookings: UpcomingBooking[] = [];

    bookingsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`[Student Dashboard] Booking ${index + 1}:`, {
        id: doc.id,
        status: data.status,
        date: data.date,
        dateType: typeof data.date,
        startTime: data.startTime,
        startTimeType: typeof data.startTime,
      });

      try {
        // Parse the date field first
        const bookingDate = parseDate(data.date);
        if (!bookingDate) {
          console.error(`[Student Dashboard] Invalid date format for booking ${doc.id}:`, data.date);
          return;
        }

        // Parse startTime, using bookingDate as base for time-only strings
        const startDate = parseTime(data.startTime, bookingDate);
        if (!startDate) {
          console.error(`[Student Dashboard] Invalid startTime format for booking ${doc.id}:`, data.startTime);
          return;
        }

        console.log(`[Student Dashboard] Booking ${index + 1} parsed:`, {
          bookingDate: bookingDate.toISOString(),
          startDate: startDate.toISOString(),
          isFuture: startDate > now,
          status: data.status,
        });

        // Check if upcoming (confirmed and in future)
        if (data.status === 'confirmed' && startDate > now) {
          upcomingCount++;
          upcomingBookings.push({
            id: doc.id,
            lessonType: data.lessonType || 'Driving Lesson',
            teacherName: data.teacherName || 'Unknown Teacher',
            startTime: startDate.toISOString(),
            location: data.location || null,
          });
        } else if (data.status === 'completed') {
          completedCount++;
        }
      } catch (parseError) {
        console.error(`[Student Dashboard] Error parsing booking ${doc.id}:`, parseError);
      }
    });

    console.log('[Student Dashboard] Counts:', { upcomingCount, completedCount });

    // Sort upcoming bookings by date
    upcomingBookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Get quiz attempts
    const quizAttemptsSnapshot = await adminDb
      .collection(COLLECTIONS.QUIZ_ATTEMPTS)
      .where('studentId', '==', studentId)
      .get();

    const totalAttempts = quizAttemptsSnapshot.size;
    const passedAttempts = quizAttemptsSnapshot.docs.filter(doc => doc.data().passed).length;

    console.log('[Student Dashboard] Quiz stats:', { totalAttempts, passedAttempts });

    const result = {
      upcomingCount,
      completedCount,
      totalAttempts,
      passedAttempts,
      upcomingBookings: upcomingBookings.slice(0, 5),
    };

    console.log('[Student Dashboard] Final result:', result);

    return result;
  } catch (error) {
    console.error('[Student Dashboard] Error getting student stats:', error);
    return {
      upcomingCount: 0,
      completedCount: 0,
      totalAttempts: 0,
      passedAttempts: 0,
      upcomingBookings: [],
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

export default async function StudentDashboard() {
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

  const stats = await getStudentStats(decodedToken.uid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userData?.displayName || 'Student'}!
        </h1>
        <p className="text-gray-600 mt-2">Here&apos;s your learning overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.upcomingCount}</div>
            <div className="text-sm text-gray-600 mt-1">Upcoming Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">{stats.completedCount}</div>
            <div className="text-sm text-gray-600 mt-1">Completed Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.totalAttempts}</div>
            <div className="text-sm text-gray-600 mt-1">Quiz Attempts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.passedAttempts}</div>
            <div className="text-sm text-gray-600 mt-1">Quizzes Passed</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Lessons ({stats.upcomingCount})</h2>
            {stats.upcomingCount > 0 && (
              <Link href="/student/bookings" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All →
              </Link>
            )}
          </div>
          
          {stats.upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <p className="text-gray-600 text-lg mb-2">No upcoming lessons scheduled</p>
              <p className="text-gray-500 text-sm mb-6">Book your first lesson to start learning!</p>
              <Link
                href="/student/bookings"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Book Your First Lesson
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{booking.lessonType}</div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <span>with {booking.teacherName}</span>
                    </div>
                    {booking.location && (
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>📍 {booking.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4 bg-blue-50 px-4 py-2 rounded-md">
                    <div className="text-sm font-semibold text-blue-900">
                      {formatDate(booking.startTime)}
                    </div>
                    <div className="text-sm text-blue-700 flex items-center gap-1 justify-end mt-1">
                      <span>{formatTime(booking.startTime)}</span>
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
          href="/student/bookings"
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">📅 Book a Lesson</div>
          <div className="text-sm opacity-90">Schedule your next driving session</div>
        </Link>
        <Link
          href="/student/quizzes"
          className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">📝 Take a Quiz</div>
          <div className="text-sm opacity-90">Test your driving knowledge</div>
        </Link>
        <Link
          href="/student/library"
          className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition block"
        >
          <div className="text-xl font-semibold mb-2">📚 Study Materials</div>
          <div className="text-sm opacity-90">Access learning resources</div>
        </Link>
      </div>
    </div>
  );
}
