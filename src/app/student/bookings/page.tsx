/**
 * Student Bookings Page
 * Displays search, available schedules, student's bookings, and driving progress
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getStudentBookings, getAvailableSchedules, getStudentProgressSummary } from '@/lib/server/actions/bookings';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import StudentBookingsClient from './client';

export default async function StudentBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const studentId = decodedToken.uid;

    // Verify user is a student
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(studentId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      redirect('/auth/login');
    }

    const [bookings, availableSchedules, progress] = await Promise.all([
      getStudentBookings(studentId),
      getAvailableSchedules(),
      getStudentProgressSummary(studentId),
    ]);

    // Calculate upcoming count
    const now = new Date();
    const upcomingCount = bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      // Combine date and startTime for accurate comparison
      const bookingDate = new Date(b.date);
      const [hours, minutes] = b.startTime.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      return bookingDate > now;
    }).length;

    return (
      <StudentBookingsClient 
        initialBookings={bookings}
        initialAvailableSchedules={availableSchedules}
        upcomingCount={upcomingCount}
        initialProgress={progress}
        studentId={studentId}
      />
    );
  } catch (error) {
    console.error('Error loading bookings page:', error);
    redirect('/auth/login');
  }
}
