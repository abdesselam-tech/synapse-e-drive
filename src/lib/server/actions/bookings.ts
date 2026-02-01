/**
 * Booking Server Actions
 * CRUD operations for student bookings with 2-hour rule enforcement
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { createBookingSchema, cancelBookingSchema } from '../validators/booking';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { Booking } from '@/lib/types/booking';
import {
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyNewBooking,
  notifyTeacherNotesAdded,
} from './notifications';

/**
 * Plain booking type for client components (all dates as ISO strings)
 */
export interface PlainBooking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  scheduleId: string;
  teacherId: string;
  teacherName: string;
  lessonType: string;
  date: string; // ISO string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  bookedAt: string; // ISO string
  cancelledAt?: string; // ISO string
  cancellationReason?: string;
  notes?: string; // Student notes
  teacherNotes?: string; // Teacher notes
  teacherNotesUpdatedAt?: string; // ISO string
}

/**
 * Available schedule for booking display
 */
export interface AvailableSchedule {
  id: string;
  teacherId: string;
  teacherName: string;
  lessonType: string;
  date: string; // ISO string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  maxStudents: number;
  bookedStudents: number;
  location?: string;
  notes?: string;
}

/**
 * Helper to convert Timestamp to ISO string
 */
function timestampToISO(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Convert Firestore booking document to plain object for client
 */
function convertBookingToPlain(doc: FirebaseFirestore.DocumentSnapshot): PlainBooking | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    studentId: data.studentId,
    studentName: data.studentName,
    studentEmail: data.studentEmail,
    scheduleId: data.scheduleId,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    lessonType: data.lessonType,
    date: timestampToISO(data.date),
    startTime: data.startTime, // Already HH:mm string
    endTime: data.endTime, // Already HH:mm string
    location: data.location || undefined,
    status: data.status,
    bookedAt: timestampToISO(data.bookedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
    cancellationReason: data.cancellationReason || undefined,
    notes: data.notes || undefined,
    teacherNotes: data.teacherNotes || undefined,
    teacherNotesUpdatedAt: data.teacherNotesUpdatedAt ? timestampToISO(data.teacherNotesUpdatedAt) : undefined,
  };
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}

/**
 * Check 2-hour booking/cancellation rule
 * Bookings and cancellations must be made at least 2 hours before lesson start
 */
function canBookOrCancel(
  dateISO: string, 
  startTime: string
): { allowed: boolean; message?: string } {
  const now = new Date();
  
  // Parse the date and time
  const lessonDate = new Date(dateISO);
  const [hours, minutes] = startTime.split(':').map(Number);
  lessonDate.setHours(hours, minutes, 0, 0);
  
  const hoursDiff = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 2) {
    return {
      allowed: false,
      message: 'Bookings and cancellations must be made at least 2 hours before the lesson starts',
    };
  }

  return { allowed: true };
}

/**
 * Get student's bookings
 */
export async function getStudentBookings(studentId: string): Promise<PlainBooking[]> {
  try {
    const user = await getCurrentUser();
    
    // Students can only see their own bookings
    if (user.uid !== studentId) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('studentId', '==', studentId)
      .get();

    const bookings = snapshot.docs
      .map(doc => convertBookingToPlain(doc))
      .filter((b): b is PlainBooking => b !== null);

    // Sort by date descending (most recent first)
    return bookings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
}

/**
 * Get available schedules for booking
 * Only returns schedules that:
 * - Have status 'available'
 * - Are at least 2 hours in the future
 * - Have available capacity
 */
export async function getAvailableSchedules(): Promise<AvailableSchedule[]> {
  try {
    // Get all available schedules
    const snapshot = await adminDb
      .collection(COLLECTIONS.SCHEDULES)
      .where('status', '==', 'available')
      .get();

    const now = new Date();
    const schedules: AvailableSchedule[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Parse date and check if it's at least 2 hours in the future
      const scheduleDate = data.date instanceof Timestamp 
        ? data.date.toDate() 
        : new Date(data.date);
      
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const lessonStart = new Date(scheduleDate);
      lessonStart.setHours(hours, minutes, 0, 0);
      
      const hoursDiff = (lessonStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Skip if less than 2 hours away
      if (hoursDiff < 2) continue;
      
      // Check capacity - count confirmed bookings for this schedule
      const bookingsSnapshot = await adminDb
        .collection(COLLECTIONS.BOOKINGS)
        .where('scheduleId', '==', doc.id)
        .where('status', '==', 'confirmed')
        .get();

      const bookedCount = bookingsSnapshot.size;
      const hasCapacity = bookedCount < data.maxStudents;

      if (hasCapacity) {
        schedules.push({
          id: doc.id,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          lessonType: data.lessonType,
          date: timestampToISO(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          maxStudents: data.maxStudents,
          bookedStudents: bookedCount,
          location: data.location || undefined,
          notes: data.notes || undefined,
        });
      }
    }

    // Sort by date ascending (soonest first)
    return schedules.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startTime.localeCompare(b.startTime);
    });
  } catch (error) {
    console.error('Error getting available schedules:', error);
    throw error;
  }
}

/**
 * Create a new booking
 */
export async function createBooking(input: { scheduleId: string; notes?: string }): Promise<{
  success: boolean;
  bookingId?: string;
  message?: string;
  error?: string;
}> {
  try {
    // Validate input
    const validated = createBookingSchema.parse(input);
    const user = await getCurrentUser();

    // Get student details
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
      throw new Error('Only students can book lessons');
    }

    const studentData = studentDoc.data()!;

    // PHASE GATE: Check if student is in "code" phase (blocked from individual bookings)
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', user.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!membershipSnapshot.empty) {
      const membershipData = membershipSnapshot.docs[0].data();
      if (membershipData.phase === 'code') {
        return {
          success: false,
          error: 'You need to complete the theory phase (Code) before booking individual lessons. Continue attending your group sessions to progress.',
        };
      }
      // Students in creneau, conduite, exam-preparation, or passed can book normally
    }
    // Students not in any group can also book normally (backward compatibility)

    // Get schedule details
    const scheduleDoc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(validated.scheduleId).get();
    if (!scheduleDoc.exists) {
      throw new Error('Schedule not found');
    }

    const scheduleData = scheduleDoc.data()!;

    // Check if schedule is available
    if (scheduleData.status !== 'available') {
      throw new Error('This schedule is no longer available');
    }

    // Get date as ISO string for 2-hour rule check
    const dateISO = timestampToISO(scheduleData.date);
    
    // Check 2-hour rule
    const ruleCheck = canBookOrCancel(dateISO, scheduleData.startTime);
    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    // Check capacity
    const bookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('scheduleId', '==', validated.scheduleId)
      .where('status', '==', 'confirmed')
      .get();

    if (bookingsSnapshot.size >= scheduleData.maxStudents) {
      throw new Error('This schedule is fully booked');
    }

    // Check for duplicate booking
    const existingBooking = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('studentId', '==', user.uid)
      .where('scheduleId', '==', validated.scheduleId)
      .where('status', '==', 'confirmed')
      .get();

    if (!existingBooking.empty) {
      throw new Error('You have already booked this lesson');
    }

    // Create booking
    const bookingData = {
      studentId: user.uid,
      studentName: studentData.displayName || studentData.email,
      studentEmail: studentData.email,
      scheduleId: validated.scheduleId,
      teacherId: scheduleData.teacherId,
      teacherName: scheduleData.teacherName,
      lessonType: scheduleData.lessonType,
      date: scheduleData.date, // Keep as Timestamp
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      status: 'confirmed',
      bookedAt: Timestamp.now(),
      notes: validated.notes || null,
    };

    const bookingRef = await adminDb.collection(COLLECTIONS.BOOKINGS).add(bookingData);

    // Update schedule's bookedStudents array
    const currentBookedStudents = scheduleData.bookedStudents || [];
    await adminDb.collection(COLLECTIONS.SCHEDULES).doc(validated.scheduleId).update({
      bookedStudents: [...currentBookedStudents, user.uid],
      updatedAt: Timestamp.now(),
    });

    // Send notifications
    try {
      const formattedDate = scheduleData.date instanceof Timestamp 
        ? scheduleData.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(scheduleData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Notify student
      await notifyBookingConfirmed(
        bookingRef.id,
        user.uid,
        scheduleData.teacherName,
        scheduleData.lessonType,
        formattedDate
      );

      // Notify teacher
      await notifyNewBooking(
        bookingRef.id,
        scheduleData.teacherId,
        studentData.displayName || studentData.email || 'A student',
        scheduleData.lessonType,
        formattedDate
      );
    } catch (notifError) {
      console.error('Error sending booking notifications:', notifError);
      // Don't fail the booking if notification fails
    }

    return {
      success: true,
      bookingId: bookingRef.id,
      message: 'Booking confirmed successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating booking:', error);
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(input: { bookingId: string; reason?: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = cancelBookingSchema.parse(input);
    const user = await getCurrentUser();

    // Get booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.BOOKINGS).doc(validated.bookingId).get();
    if (!bookingDoc.exists) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingDoc.data()!;

    // Check ownership
    if (bookingData.studentId !== user.uid) {
      throw new Error('Unauthorized');
    }

    // Check if already cancelled
    if (bookingData.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Get date as ISO string for 2-hour rule check
    const dateISO = timestampToISO(bookingData.date);
    
    // Check 2-hour rule
    const ruleCheck = canBookOrCancel(dateISO, bookingData.startTime);
    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    // Cancel booking
    await adminDb.collection(COLLECTIONS.BOOKINGS).doc(validated.bookingId).update({
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancellationReason: validated.reason || null,
    });

    // Update schedule's bookedStudents array - remove the student
    const scheduleId = bookingData.scheduleId;
    const scheduleDoc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).get();
    
    if (scheduleDoc.exists) {
      const scheduleData = scheduleDoc.data()!;
      const currentBookedStudents = scheduleData.bookedStudents || [];
      const updatedBookedStudents = currentBookedStudents.filter(
        (id: string) => id !== user.uid
      );
      
      await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).update({
        bookedStudents: updatedBookedStudents,
        updatedAt: Timestamp.now(),
      });
    }

    // Send cancellation notification
    try {
      await notifyBookingCancelled(
        validated.bookingId,
        bookingData.studentId,
        bookingData.lessonType || 'Lesson',
        validated.reason || 'Cancelled by student'
      );
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
    }

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  } catch (error: unknown) {
    console.error('Error cancelling booking:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel booking';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// TEACHER NOTES FUNCTIONS
// ============================================================================

/**
 * Teacher: Add/update notes for a booking
 */
export async function addTeacherNoteToBooking(
  bookingId: string, 
  notes: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    // Get booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.BOOKINGS).doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingDoc.data()!;

    // Verify user is the teacher for this booking or admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (bookingData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Only the assigned teacher or admin can add notes');
    }

    // Update booking with teacher notes
    await adminDb.collection(COLLECTIONS.BOOKINGS).doc(bookingId).update({
      teacherNotes: notes.trim() || null,
      teacherNotesUpdatedAt: Timestamp.now(),
      teacherNotesUpdatedBy: user.uid,
    });

    // Send notification to student
    try {
      const teacherName = userDoc.data()?.displayName || userDoc.data()?.email || 'Your teacher';
      await notifyTeacherNotesAdded(
        bookingId,
        bookingData.studentId,
        teacherName
      );
    } catch (notifError) {
      console.error('Error sending teacher notes notification:', notifError);
    }

    return {
      success: true,
      message: 'Notes saved successfully',
    };
  } catch (error: unknown) {
    console.error('Error adding teacher notes:', error);
    const message = error instanceof Error ? error.message : 'Failed to save notes';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Teacher booking with notes type
 */
export interface TeacherBookingWithNotes {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  scheduleId: string;
  lessonType: string;
  date: string;
  startTime: string;
  location: string | null;
  studentNotes: string | null;
  teacherNotes: string | null;
  teacherNotesUpdatedAt: string | null;
  status: string;
  // Completion fields
  completed?: boolean;
  completedAt?: string;
  hoursCompleted?: number;
  performanceRating?: number;
}

/**
 * Teacher: Get all bookings for their schedules with notes
 */
export async function getTeacherBookingsWithNotes(
  teacherId: string
): Promise<TeacherBookingWithNotes[]> {
  try {
    const user = await getCurrentUser();
    
    // Verify user is the teacher or admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (user.uid !== teacherId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Get all confirmed AND completed bookings for this teacher
    // We need both so teachers can see completed lessons and mark pending ones
    const [confirmedSnapshot, completedSnapshot] = await Promise.all([
      adminDb
        .collection(COLLECTIONS.BOOKINGS)
        .where('teacherId', '==', teacherId)
        .where('status', '==', 'confirmed')
        .get(),
      adminDb
        .collection(COLLECTIONS.BOOKINGS)
        .where('teacherId', '==', teacherId)
        .where('status', '==', 'completed')
        .get(),
    ]);
    
    const allDocs = [...confirmedSnapshot.docs, ...completedSnapshot.docs];

    const bookings: TeacherBookingWithNotes[] = [];

    for (const doc of allDocs) {
      const data = doc.data();
      
      // Parse the date to get a proper date object for startTime
      let dateObj: Date;
      if (data.date instanceof Timestamp) {
        dateObj = data.date.toDate();
      } else if (typeof data.date === 'string') {
        dateObj = new Date(data.date);
      } else if (data.date && typeof data.date === 'object' && '_seconds' in data.date) {
        dateObj = new Date((data.date as { _seconds: number })._seconds * 1000);
      } else {
        dateObj = new Date();
      }

      // Create full datetime from date and startTime
      let startDateTime: Date;
      if (typeof data.startTime === 'string' && !data.startTime.includes('T')) {
        // Time-only string like '09:00'
        const [hours, minutes] = data.startTime.split(':').map(Number);
        startDateTime = new Date(dateObj);
        startDateTime.setHours(hours, minutes, 0, 0);
      } else if (data.startTime instanceof Timestamp) {
        startDateTime = data.startTime.toDate();
      } else {
        startDateTime = new Date(data.startTime);
      }

      bookings.push({
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        scheduleId: data.scheduleId,
        lessonType: data.lessonType,
        date: dateObj.toISOString(),
        startTime: startDateTime.toISOString(),
        location: data.location || null,
        studentNotes: data.notes || null,
        teacherNotes: data.teacherNotes || null,
        teacherNotesUpdatedAt: data.teacherNotesUpdatedAt 
          ? timestampToISO(data.teacherNotesUpdatedAt) 
          : null,
        status: data.status,
        // Completion fields
        completed: data.completed || false,
        completedAt: data.completedAt ? timestampToISO(data.completedAt) : undefined,
        hoursCompleted: data.hoursCompleted,
        performanceRating: data.performanceRating,
      });
    }

    // Sort by date descending (most recent first)
    return bookings.sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  } catch (error) {
    console.error('Error getting teacher bookings:', error);
    throw error;
  }
}

// ============================================================================
// LESSON COMPLETION & PROGRESS TRACKING
// ============================================================================

import { FieldValue } from 'firebase-admin/firestore';
import { MIN_HOURS_FOR_EXAM, MIN_RATING_FOR_EXAM } from '@/lib/utils/constants/lessonTypes';
import type { CompleteBookingInput, StudentProgress } from '@/lib/types/booking';
import { createNotification } from './notifications';

/**
 * Mark a booking/lesson as completed (Teacher only)
 * Records performance data and updates student's total hours
 */
export async function completeBooking(input: CompleteBookingInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  totalHours?: number;
}> {
  try {
    const user = await getCurrentUser();

    const bookingDoc = await adminDb.collection(COLLECTIONS.BOOKINGS).doc(input.bookingId).get();
    if (!bookingDoc.exists) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingDoc.data()!;

    // Verify the booking is confirmed (not already completed or cancelled)
    if (bookingData.status === 'completed') {
      throw new Error('This lesson is already marked as completed');
    }
    if (bookingData.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled booking');
    }

    // Verify teacher owns this booking (or is admin)
    if (bookingData.teacherId !== user.uid) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new Error('Only the assigned teacher can complete bookings');
      }
    }

    // Update booking with completion data
    await bookingDoc.ref.update({
      completed: true,
      completedAt: Timestamp.now(),
      hoursCompleted: input.hoursCompleted,
      performanceRating: input.performanceRating,
      skillsImproved: input.skillsImproved,
      areasToImprove: input.areasToImprove,
      readyForNextLevel: input.readyForNextLevel,
      status: 'completed',
      updatedAt: Timestamp.now(),
    });

    // Update student's total driving hours
    const studentRef = adminDb.collection(COLLECTIONS.USERS).doc(bookingData.studentId);
    await studentRef.update({
      totalDrivingHours: FieldValue.increment(input.hoursCompleted),
      lastLessonDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Notify student about completion
    try {
      await createNotification({
        userId: bookingData.studentId,
        type: 'booking_confirmed', // Using existing type
        priority: 'normal',
        title: '✅ Lesson Completed',
        message: `Your ${bookingData.lessonType || 'driving'} lesson has been marked complete. ${input.hoursCompleted} hour(s) logged. Rating: ${'⭐'.repeat(input.performanceRating)}`,
        actionUrl: `/student/bookings`,
        actionLabel: 'View Progress',
        metadata: { 
          bookingId: input.bookingId, 
          hoursCompleted: input.hoursCompleted,
          rating: input.performanceRating,
        },
      });
    } catch (notifError) {
      console.error('Error sending completion notification:', notifError);
    }

    return {
      success: true,
      message: 'Lesson marked as completed',
      totalHours: input.hoursCompleted,
    };

  } catch (error: unknown) {
    console.error('Error completing booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete booking',
    };
  }
}

/**
 * Get student's driving progress summary
 * Calculates total hours, average rating, skills, and exam readiness
 */
export async function getStudentProgressSummary(studentId: string): Promise<StudentProgress> {
  try {
    const user = await getCurrentUser();

    // Verify permission (own progress, or teacher/admin viewing)
    if (user.uid !== studentId) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      const userRole = userDoc.data()?.role;
      if (userRole !== 'teacher' && userRole !== 'admin') {
        throw new Error('Unauthorized to view this student\'s progress');
      }
    }

    // Get all completed bookings for this student
    const completedBookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('studentId', '==', studentId)
      .where('status', '==', 'completed')
      .get();

    const bookings = completedBookingsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lessonType: data.lessonType || 'Unknown',
        hoursCompleted: data.hoursCompleted || 0,
        performanceRating: data.performanceRating || 0,
        skillsImproved: data.skillsImproved || [],
        completedAt: data.completedAt ? timestampToISO(data.completedAt) : null,
      };
    });

    // Calculate totals
    const totalHours = bookings.reduce((sum, b) => sum + (b.hoursCompleted || 0), 0);
    const ratingsWithValue = bookings.filter(b => b.performanceRating > 0);
    const averageRating = ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, b) => sum + b.performanceRating, 0) / ratingsWithValue.length
      : 0;

    // Aggregate skills
    const skillsMap = new Map<string, number>();
    bookings.forEach(b => {
      (b.skillsImproved || []).forEach((skill: string) => {
        skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
      });
    });

    // Get top 5 skills
    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    // Determine exam readiness
    const readyForExam = totalHours >= MIN_HOURS_FOR_EXAM && averageRating >= MIN_RATING_FOR_EXAM;

    // Count bookings by lesson type
    const bookingsByType = bookings.reduce((acc, b) => {
      const type = b.lessonType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get most recent lesson date
    const sortedBookings = bookings
      .filter(b => b.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    return {
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      totalLessons: bookings.length,
      averageRating: Math.round(averageRating * 10) / 10,
      topSkills,
      readyForExam,
      lastLesson: sortedBookings[0]?.completedAt || null,
      bookingsByType,
    };

  } catch (error) {
    console.error('Error getting student progress:', error);
    throw error;
  }
}

/**
 * Get bookings ready for completion (for teacher dashboard)
 * Returns confirmed bookings whose scheduled time has passed
 */
export async function getBookingsReadyForCompletion(teacherId: string): Promise<PlainBooking[]> {
  try {
    const user = await getCurrentUser();

    // Verify permission
    if (user.uid !== teacherId) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
    }

    const now = new Date();

    // Get all confirmed bookings for this teacher
    const bookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('teacherId', '==', teacherId)
      .where('status', '==', 'confirmed')
      .get();

    const bookings: PlainBooking[] = [];

    for (const doc of bookingsSnapshot.docs) {
      const data = doc.data();
      
      // Parse the booking date and time
      let bookingDateTime: Date;
      
      if (data.date instanceof Timestamp) {
        bookingDateTime = data.date.toDate();
      } else if (typeof data.date === 'string') {
        bookingDateTime = new Date(data.date);
      } else {
        continue;
      }

      // Add end time to get when the lesson should be finished
      if (data.endTime) {
        const [hours, minutes] = data.endTime.split(':').map(Number);
        bookingDateTime.setHours(hours, minutes);
      }

      // Only include bookings whose scheduled time has passed
      if (bookingDateTime <= now) {
        bookings.push({
          id: doc.id,
          scheduleId: data.scheduleId,
          studentId: data.studentId,
          studentName: data.studentName,
          studentEmail: data.studentEmail,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          lessonType: data.lessonType || 'Unknown',
          date: timestampToISO(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          bookedAt: timestampToISO(data.bookedAt),
          notes: data.notes,
          teacherNotes: data.teacherNotes,
        });
      }
    }

    // Sort by date (oldest first - these need attention)
    return bookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  } catch (error) {
    console.error('Error getting bookings ready for completion:', error);
    throw error;
  }
}
