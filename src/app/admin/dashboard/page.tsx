/**
 * Admin Dashboard Page
 * Platform overview and management with real stats
 * Handles both full timestamps and time-only strings
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

type AdminStats = {
  totalUsers: number;
  students: number;
  teachers: number;
  totalSchedules: number;
  upcomingSchedules: number;
  totalQuizzes: number;
  upcomingBookings: number;
  pendingExamRequests: number;
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

async function getAdminStats(): Promise<AdminStats> {
  try {
    console.log('[Admin Dashboard] Getting platform stats');
    
    const now = new Date();
    console.log('[Admin Dashboard] Current time:', now.toISOString());

    // Get users count
    const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).get();
    const totalUsers = usersSnapshot.size;
    const students = usersSnapshot.docs.filter(doc => doc.data().role === 'student').length;
    const teachers = usersSnapshot.docs.filter(doc => doc.data().role === 'teacher').length;

    console.log('[Admin Dashboard] Users:', { totalUsers, students, teachers });

    // Get schedules
    const schedulesSnapshot = await adminDb.collection(COLLECTIONS.SCHEDULES).get();
    const totalSchedules = schedulesSnapshot.size;

    let upcomingSchedules = 0;
    schedulesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      try {
        // Parse date field
        const scheduleDate = parseDate(data.date);
        if (!scheduleDate) return;

        // Parse startTime, using date as base
        const startDate = parseTime(data.startTime, scheduleDate);
        if (!startDate || isNaN(startDate.getTime())) return;

        if (startDate > now) {
          upcomingSchedules++;
        }
      } catch {
        // Skip invalid schedules
      }
    });

    console.log('[Admin Dashboard] Schedules:', { totalSchedules, upcomingSchedules });

    // Get bookings
    const bookingsSnapshot = await adminDb.collection(COLLECTIONS.BOOKINGS).get();
    
    let upcomingBookings = 0;
    bookingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      try {
        // Parse date field
        const bookingDate = parseDate(data.date);
        if (!bookingDate) return;

        // Parse startTime, using date as base
        const startDate = parseTime(data.startTime, bookingDate);
        if (!startDate || isNaN(startDate.getTime())) return;

        if (data.status === 'confirmed' && startDate > now) {
          upcomingBookings++;
        }
      } catch {
        // Skip invalid bookings
      }
    });

    console.log('[Admin Dashboard] Bookings:', { total: bookingsSnapshot.size, upcomingBookings });

    // Get quizzes
    const quizzesSnapshot = await adminDb.collection(COLLECTIONS.QUIZZES).get();
    const totalQuizzes = quizzesSnapshot.size;

    // Get pending exam requests
    let pendingExamRequests = 0;
    try {
      const examRequestsSnapshot = await adminDb
        .collection(COLLECTIONS.EXAM_REQUESTS)
        .where('status', '==', 'pending')
        .get();
      pendingExamRequests = examRequestsSnapshot.size;
    } catch (e) {
      console.log('[Admin Dashboard] Could not get exam requests:', e);
    }

    const result = {
      totalUsers,
      students,
      teachers,
      totalSchedules,
      upcomingSchedules,
      totalQuizzes,
      upcomingBookings,
      pendingExamRequests,
    };

    console.log('[Admin Dashboard] Final result:', result);

    return result;
  } catch (error) {
    console.error('[Admin Dashboard] Error getting admin stats:', error);
    return {
      totalUsers: 0,
      students: 0,
      teachers: 0,
      totalSchedules: 0,
      upcomingSchedules: 0,
      totalQuizzes: 0,
      upcomingBookings: 0,
      pendingExamRequests: 0,
    };
  }
}

export default async function AdminDashboard() {
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

  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userData?.displayName || 'Admin'}!
        </h1>
        <p className="text-gray-600 mt-2">Platform overview and management</p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">👥 Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600 mt-1">Total Users</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600">{stats.students}</div>
              <div className="text-sm text-gray-600 mt-1">Students</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600">{stats.teachers}</div>
              <div className="text-sm text-gray-600 mt-1">Teachers</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedules & Lessons Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">📅 Schedules & Lessons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.totalSchedules}</div>
              <div className="text-sm text-gray-600 mt-1">Total Schedules</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600">{stats.upcomingSchedules}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming Lessons</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-orange-600">{stats.upcomingBookings}</div>
              <div className="text-sm text-gray-600 mt-1">Confirmed Bookings</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz & Exam Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">📝 Quizzes & Exams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600">{stats.totalQuizzes}</div>
              <div className="text-sm text-gray-600 mt-1">Total Quizzes</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">{stats.pendingExamRequests}</div>
                  <div className="text-sm text-gray-600 mt-1">Pending Exam Requests</div>
                </div>
                {stats.pendingExamRequests > 0 && (
                  <Link
                    href="/admin/exam-requests"
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Review →
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition shadow-lg hover:shadow-xl block"
          >
            <div className="text-xl font-semibold mb-2">👥 Manage Users</div>
            <div className="text-sm opacity-90">Create and edit users</div>
          </Link>
          <Link
            href="/admin/schedules"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition shadow-lg hover:shadow-xl block"
          >
            <div className="text-xl font-semibold mb-2">📅 View Schedules</div>
            <div className="text-sm opacity-90">Monitor all lessons</div>
          </Link>
          <Link
            href="/admin/exam-requests"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition shadow-lg hover:shadow-xl block"
          >
            <div className="text-xl font-semibold mb-2">📋 Exam Requests</div>
            <div className="text-sm opacity-90">Review student requests</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
