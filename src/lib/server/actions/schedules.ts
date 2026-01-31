/**
 * Schedule Server Actions
 * CRUD operations for teacher schedules
 */

'use server';

import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { requireAuth, requireAuthWithAnyRole, toDate } from './helpers';
import { scheduleCreateSchema, scheduleUpdateSchema } from '../validators/schemas';
import { ValidationError, AuthorizationError, NotFoundError } from '@/lib/utils/errors';
import type { Schedule, ScheduleFormData } from '@/lib/types/schedule';
import { notifyBookingCancelled } from './notifications';

/**
 * Plain schedule type for client components (all dates as ISO strings)
 */
export interface PlainSchedule {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO string
  startTime: string;
  endTime: string;
  lessonType: 'theoretical' | 'practical' | 'exam_prep';
  maxStudents: number;
  bookedStudents: string[];
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
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
  // Handle Firestore Timestamp-like objects
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Convert Firestore schedule document to plain object for client
 */
function convertScheduleToPlain(doc: FirebaseFirestore.DocumentSnapshot): PlainSchedule | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    date: timestampToISO(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    lessonType: data.lessonType,
    maxStudents: data.maxStudents,
    bookedStudents: data.bookedStudents || [],
    status: data.status,
    location: data.location || undefined,
    notes: data.notes || undefined,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
  };
}

/**
 * Convert schedule data object to plain object for client (used after creates)
 */
function convertScheduleDataToPlain(
  id: string,
  data: Omit<Schedule, 'id'>
): PlainSchedule {
  return {
    id,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    date: timestampToISO(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    lessonType: data.lessonType,
    maxStudents: data.maxStudents,
    bookedStudents: data.bookedStudents || [],
    status: data.status,
    location: data.location || undefined,
    notes: data.notes || undefined,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
  };
}

/**
 * Get auth token from cookies
 */
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

/**
 * Check for overlapping schedules (prevent double-booking)
 */
async function checkOverlappingSchedule(
  teacherId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<boolean> {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const scheduleStart = new Date(date);
  scheduleStart.setHours(startHour, startMin, 0, 0);
  
  const scheduleEnd = new Date(date);
  scheduleEnd.setHours(endHour, endMin, 0, 0);

  // Get all schedules for this teacher on this date
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const schedulesRef = adminDb.collection(COLLECTIONS.SCHEDULES);
  const query = schedulesRef
    .where('teacherId', '==', teacherId)
    .where('date', '>=', Timestamp.fromDate(dayStart))
    .where('date', '<=', Timestamp.fromDate(dayEnd));

  const snapshot = await query.get();

  for (const doc of snapshot.docs) {
    // Skip the schedule being updated
    if (excludeScheduleId && doc.id === excludeScheduleId) continue;

    const existingSchedule = doc.data();
    const [existingStartHour, existingStartMin] = existingSchedule.startTime.split(':').map(Number);
    const [existingEndHour, existingEndMin] = existingSchedule.endTime.split(':').map(Number);

    const existingStart = new Date(date);
    existingStart.setHours(existingStartHour, existingStartMin, 0, 0);

    const existingEnd = new Date(date);
    existingEnd.setHours(existingEndHour, existingEndMin, 0, 0);

    // Check for overlap
    if (
      (scheduleStart >= existingStart && scheduleStart < existingEnd) ||
      (scheduleEnd > existingStart && scheduleEnd <= existingEnd) ||
      (scheduleStart <= existingStart && scheduleEnd >= existingEnd)
    ) {
      return true; // Overlap found
    }
  }

  return false; // No overlap
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: ScheduleFormData): Promise<PlainSchedule> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['teacher', 'admin']);

  // Validate input
  const validationResult = scheduleCreateSchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError('Invalid schedule data', validationResult.error.flatten().fieldErrors);
  }

  const validatedData = validationResult.data;

  // Check for overlapping schedules
  const hasOverlap = await checkOverlappingSchedule(
    user.id,
    validatedData.date,
    validatedData.startTime,
    validatedData.endTime
  );

  if (hasOverlap) {
    throw new ValidationError('This time slot overlaps with an existing schedule');
  }

  // Get teacher name
  const teacherDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.id).get();
  const teacherName = teacherDoc.data()?.displayName || user.email;

  // Set maxStudents based on lessonType if not provided correctly
  let maxStudents = validatedData.maxStudents;
  if (validatedData.lessonType === 'practical' && maxStudents !== 1) {
    maxStudents = 1;
  }

  // Create schedule document
  const scheduleDate = new Date(validatedData.date);
  scheduleDate.setHours(0, 0, 0, 0);

  const now = Timestamp.now();
  const scheduleData: Omit<Schedule, 'id'> = {
    teacherId: user.id,
    teacherName,
    date: Timestamp.fromDate(scheduleDate),
    startTime: validatedData.startTime,
    endTime: validatedData.endTime,
    lessonType: validatedData.lessonType,
    maxStudents,
    bookedStudents: [],
    status: 'available' as const,
    createdAt: now,
    updatedAt: now,
  };

  if (validatedData.location?.trim()) {
    scheduleData.location = validatedData.location.trim();
  }

  if (validatedData.notes?.trim()) {
    scheduleData.notes = validatedData.notes.trim();
  }

  const docRef = await adminDb.collection(COLLECTIONS.SCHEDULES).add(scheduleData);

  // Return plain object for client
  return convertScheduleDataToPlain(docRef.id, scheduleData);
}

/**
 * Get schedules by teacher ID
 */
export async function getSchedulesByTeacher(teacherId: string): Promise<PlainSchedule[]> {
  const token = await getAuthToken();
  const user = await requireAuth(token);

  // Only allow teachers/admins to view schedules, or the teacher viewing their own
  if (user.role !== 'admin' && user.id !== teacherId) {
    throw new AuthorizationError('You can only view your own schedules');
  }

  // Simple query without composite index requirement
  const snapshot = await adminDb
    .collection(COLLECTIONS.SCHEDULES)
    .where('teacherId', '==', teacherId)
    .get();

  const schedules = snapshot.docs
    .map((doc) => convertScheduleToPlain(doc))
    .filter((s): s is PlainSchedule => s !== null);

  // Sort in JavaScript: by date ascending, then by startTime ascending
  return schedules.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(scheduleId: string): Promise<PlainSchedule> {
  const token = await getAuthToken();
  await requireAuth(token);

  const doc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Schedule not found');
  }

  const plain = convertScheduleToPlain(doc);
  if (!plain) {
    throw new NotFoundError('Schedule data is invalid');
  }

  return plain;
}

/**
 * Get schedule by ID (internal use - returns raw data for overlap checks)
 */
async function getScheduleByIdInternal(scheduleId: string): Promise<{ id: string; data: FirebaseFirestore.DocumentData }> {
  const doc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Schedule not found');
  }

  const data = doc.data();
  if (!data) {
    throw new NotFoundError('Schedule data is invalid');
  }

  return { id: doc.id, data };
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  scheduleId: string,
  data: Partial<ScheduleFormData>
): Promise<PlainSchedule> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['teacher', 'admin']);

  // Get existing schedule (internal for checking)
  const { data: existingData } = await getScheduleByIdInternal(scheduleId);

  // Verify ownership (unless admin)
  if (user.role !== 'admin' && existingData.teacherId !== user.id) {
    throw new AuthorizationError('You can only update your own schedules');
  }

  // Prevent updating schedules with booked students (unless admin)
  if (user.role !== 'admin' && existingData.bookedStudents?.length > 0) {
    throw new ValidationError('Cannot update schedule with booked students');
  }

  // Validate input
  const validationResult = scheduleUpdateSchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError('Invalid schedule data', validationResult.error.flatten().fieldErrors);
  }

  const validatedData = validationResult.data;

  // Check for overlapping schedules if time/date changed
  if (validatedData.date || validatedData.startTime || validatedData.endTime) {
    const checkDate = validatedData.date || toDate(existingData.date);
    const checkStartTime = validatedData.startTime || existingData.startTime;
    const checkEndTime = validatedData.endTime || existingData.endTime;

    const hasOverlap = await checkOverlappingSchedule(
      existingData.teacherId,
      checkDate,
      checkStartTime,
      checkEndTime,
      scheduleId
    );

    if (hasOverlap) {
      throw new ValidationError('This time slot overlaps with an existing schedule');
    }
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (validatedData.date !== undefined) {
    const scheduleDate = new Date(validatedData.date);
    scheduleDate.setHours(0, 0, 0, 0);
    updateData.date = Timestamp.fromDate(scheduleDate);
  }

  if (validatedData.startTime !== undefined) {
    updateData.startTime = validatedData.startTime;
  }

  if (validatedData.endTime !== undefined) {
    updateData.endTime = validatedData.endTime;
  }

  if (validatedData.lessonType !== undefined) {
    updateData.lessonType = validatedData.lessonType;
    // Auto-adjust maxStudents if lessonType changes
    if (validatedData.lessonType === 'practical') {
      updateData.maxStudents = 1;
    }
  }

  if (validatedData.maxStudents !== undefined) {
    updateData.maxStudents = validatedData.maxStudents;
  }

  if (validatedData.location !== undefined) {
    const trimmed = validatedData.location.trim();
    updateData.location = trimmed ? trimmed : FieldValue.delete();
  }

  if (validatedData.notes !== undefined) {
    const trimmed = validatedData.notes.trim();
    updateData.notes = trimmed ? trimmed : FieldValue.delete();
  }

  // Update schedule
  await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).update(updateData);

  // Fetch and return updated schedule as plain object
  return getScheduleById(scheduleId);
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['teacher', 'admin']);

  // Get existing schedule
  const { data: existingData } = await getScheduleByIdInternal(scheduleId);

  // Verify ownership (unless admin)
  if (user.role !== 'admin' && existingData.teacherId !== user.id) {
    throw new AuthorizationError('You can only delete your own schedules');
  }

  // Prevent deleting schedules with booked students (unless admin)
  if (user.role !== 'admin' && existingData.bookedStudents?.length > 0) {
    throw new ValidationError('Cannot delete schedule with booked students');
  }

  // Delete schedule
  await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).delete();
}

// ============================================================================
// ADMIN SCHEDULE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Admin: Get all teachers (for dropdown selection)
 */
export async function getAllTeachers(): Promise<Array<{ id: string; name: string; email: string }>> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['admin']);

  const teachersSnapshot = await adminDb
    .collection(COLLECTIONS.USERS)
    .where('role', '==', 'teacher')
    .get();

  return teachersSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().displayName || doc.data().email,
    email: doc.data().email,
  }));
}

/**
 * Admin: Create schedule for any teacher
 */
export async function adminCreateSchedule(input: {
  teacherId: string;
  lessonType: string;
  date: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  location?: string;
  notes?: string;
}): Promise<string> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['admin']);

  const { teacherId, lessonType, date, startTime, endTime, maxStudents, location, notes } = input;

  // Get teacher info
  const teacherDoc = await adminDb.collection(COLLECTIONS.USERS).doc(teacherId).get();
  if (!teacherDoc.exists || teacherDoc.data()?.role !== 'teacher') {
    throw new ValidationError('Invalid teacher ID - user is not a teacher');
  }

  const teacherData = teacherDoc.data()!;

  // Check for overlapping schedules
  const scheduleDate = new Date(date);
  const hasOverlap = await checkOverlappingSchedule(
    teacherId,
    scheduleDate,
    startTime,
    endTime
  );

  if (hasOverlap) {
    throw new ValidationError('This time slot overlaps with an existing schedule for this teacher');
  }

  // Get admin name for createdBy
  const adminDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.id).get();
  const adminName = adminDoc.data()?.displayName || adminDoc.data()?.email || 'Admin';

  const now = Timestamp.now();
  scheduleDate.setHours(0, 0, 0, 0);

  const scheduleData = {
    teacherId,
    teacherName: teacherData.displayName || teacherData.email,
    lessonType,
    date: Timestamp.fromDate(scheduleDate),
    startTime,
    endTime,
    maxStudents,
    bookedStudents: [],
    location: location?.trim() || null,
    notes: notes?.trim() || null,
    status: 'available',
    createdBy: user.id,
    createdByName: adminName,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await adminDb.collection(COLLECTIONS.SCHEDULES).add(scheduleData);

  return docRef.id;
}

/**
 * Admin: Get all schedules with optional filters
 */
export async function adminGetAllSchedules(filters?: {
  teacherId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PlainSchedule[]> {
  const token = await getAuthToken();
  await requireAuthWithAnyRole(token, ['admin']);

  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.SCHEDULES);

  if (filters?.teacherId) {
    query = query.where('teacherId', '==', filters.teacherId);
  }

  const snapshot = await query.limit(200).get();

  let schedules = snapshot.docs
    .map((doc) => convertScheduleToPlain(doc))
    .filter((s): s is PlainSchedule => s !== null);

  // Apply date filters in JavaScript
  if (filters?.fromDate) {
    const from = new Date(filters.fromDate);
    schedules = schedules.filter(s => new Date(s.date) >= from);
  }

  if (filters?.toDate) {
    const to = new Date(filters.toDate);
    schedules = schedules.filter(s => new Date(s.date) <= to);
  }

  // Sort by date descending (newest first)
  return schedules.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Admin: Get schedule details with booked students
 */
export async function adminGetScheduleDetails(scheduleId: string): Promise<{
  schedule: PlainSchedule;
  students: Array<{
    bookingId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    bookedAt: string;
    status: string;
    notes: string | null;
  }>;
}> {
  const token = await getAuthToken();
  await requireAuthWithAnyRole(token, ['admin']);

  // Get schedule
  const scheduleDoc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).get();
  if (!scheduleDoc.exists) {
    throw new NotFoundError('Schedule not found');
  }

  const schedule = convertScheduleToPlain(scheduleDoc);
  if (!schedule) {
    throw new NotFoundError('Schedule data is invalid');
  }

  // Get all bookings for this schedule
  const bookingsSnapshot = await adminDb
    .collection(COLLECTIONS.BOOKINGS)
    .where('scheduleId', '==', scheduleId)
    .get();

  const students = bookingsSnapshot.docs.map((doc) => {
    const booking = doc.data();
    return {
      bookingId: doc.id,
      studentId: booking.studentId,
      studentName: booking.studentName || 'Unknown',
      studentEmail: booking.studentEmail || 'Unknown',
      bookedAt: timestampToISO(booking.createdAt),
      status: booking.status,
      notes: booking.notes || null,
    };
  });

  return { schedule, students };
}

/**
 * Admin: Update any schedule
 */
export async function adminUpdateSchedule(
  scheduleId: string,
  input: {
    lessonType?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    maxStudents?: number;
    location?: string;
    notes?: string;
  }
): Promise<PlainSchedule> {
  const token = await getAuthToken();
  const user = await requireAuthWithAnyRole(token, ['admin']);

  // Get existing schedule
  const { data: existingData } = await getScheduleByIdInternal(scheduleId);

  // Check for overlapping schedules if time/date changed
  if (input.date || input.startTime || input.endTime) {
    const checkDate = input.date ? new Date(input.date) : toDate(existingData.date);
    const checkStartTime = input.startTime || existingData.startTime;
    const checkEndTime = input.endTime || existingData.endTime;

    const hasOverlap = await checkOverlappingSchedule(
      existingData.teacherId,
      checkDate,
      checkStartTime,
      checkEndTime,
      scheduleId
    );

    if (hasOverlap) {
      throw new ValidationError('This time slot overlaps with an existing schedule');
    }
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
    updatedBy: user.id,
  };

  if (input.lessonType) updateData.lessonType = input.lessonType;
  
  if (input.date) {
    const scheduleDate = new Date(input.date);
    scheduleDate.setHours(0, 0, 0, 0);
    updateData.date = Timestamp.fromDate(scheduleDate);
  }
  
  if (input.startTime) updateData.startTime = input.startTime;
  if (input.endTime) updateData.endTime = input.endTime;
  if (input.maxStudents !== undefined) updateData.maxStudents = input.maxStudents;
  
  if (input.location !== undefined) {
    updateData.location = input.location?.trim() || null;
  }
  
  if (input.notes !== undefined) {
    updateData.notes = input.notes?.trim() || null;
  }

  await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).update(updateData);

  return getScheduleById(scheduleId);
}

/**
 * Admin: Delete any schedule (cancels all bookings and notifies students)
 */
export async function adminDeleteSchedule(scheduleId: string): Promise<void> {
  const token = await getAuthToken();
  await requireAuthWithAnyRole(token, ['admin']);

  // Verify schedule exists
  const scheduleDoc = await adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId).get();
  if (!scheduleDoc.exists) {
    throw new NotFoundError('Schedule not found');
  }

  const scheduleData = scheduleDoc.data()!;

  // Get all confirmed bookings for this schedule
  const bookingsSnapshot = await adminDb
    .collection(COLLECTIONS.BOOKINGS)
    .where('scheduleId', '==', scheduleId)
    .where('status', '==', 'confirmed')
    .get();

  const batch = adminDb.batch();
  
  // Cancel all bookings and notify students
  for (const doc of bookingsSnapshot.docs) {
    const bookingData = doc.data();
    
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancellationReason: 'Schedule deleted by admin',
    });
    
    // Notify student about cancellation
    try {
      await notifyBookingCancelled(
        doc.id,
        bookingData.studentId,
        scheduleData.lessonType || 'Lesson',
        'Schedule cancelled by administrator'
      );
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
    }
  }

  // Delete the schedule
  batch.delete(adminDb.collection(COLLECTIONS.SCHEDULES).doc(scheduleId));

  await batch.commit();
}

// ============================================================================
// SEARCH AND FILTER FUNCTIONS
// ============================================================================

/**
 * Student: Search and filter available schedules
 */
export async function searchAvailableSchedules(filters: {
  teacherName?: string;
  lessonType?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  availableOnly?: boolean;
}): Promise<PlainSchedule[]> {
  const token = await getAuthToken();
  await requireAuth(token);

  // Get all available schedules
  const snapshot = await adminDb
    .collection(COLLECTIONS.SCHEDULES)
    .where('status', '==', 'available')
    .get();

  let schedules = snapshot.docs
    .map((doc) => convertScheduleToPlain(doc))
    .filter((s): s is PlainSchedule => s !== null);

  const now = new Date();

  // Filter: Only future schedules
  schedules = schedules.filter(s => new Date(s.date) > now);

  // Filter: Date range
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    schedules = schedules.filter(s => new Date(s.date) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    schedules = schedules.filter(s => new Date(s.date) <= to);
  }

  // Filter: Lesson type
  if (filters.lessonType) {
    schedules = schedules.filter(s => s.lessonType === filters.lessonType);
  }

  // Filter: Location
  if (filters.location) {
    schedules = schedules.filter(s => s.location === filters.location);
  }

  // Filter: Teacher name (partial match)
  if (filters.teacherName) {
    const searchTerm = filters.teacherName.toLowerCase();
    schedules = schedules.filter(s => 
      s.teacherName.toLowerCase().includes(searchTerm)
    );
  }

  // Filter: Available only (has capacity)
  if (filters.availableOnly !== false) {
    schedules = schedules.filter(s => 
      (s.bookedStudents?.length || 0) < s.maxStudents
    );
  }

  // Sort by date ascending
  return schedules.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Teacher: Filter own schedules
 */
export async function filterTeacherSchedules(
  teacherId: string,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    lessonType?: string;
    status?: 'available' | 'full' | 'all';
  }
): Promise<PlainSchedule[]> {
  const token = await getAuthToken();
  const user = await requireAuth(token);

  // Verify user is the teacher or admin
  if (user.id !== teacherId && user.role !== 'admin') {
    throw new AuthorizationError('Unauthorized');
  }

  const snapshot = await adminDb
    .collection(COLLECTIONS.SCHEDULES)
    .where('teacherId', '==', teacherId)
    .get();

  let schedules = snapshot.docs
    .map((doc) => convertScheduleToPlain(doc))
    .filter((s): s is PlainSchedule => s !== null);

  // Filter: Date range
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    schedules = schedules.filter(s => new Date(s.date) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    schedules = schedules.filter(s => new Date(s.date) <= to);
  }

  // Filter: Lesson type
  if (filters.lessonType) {
    schedules = schedules.filter(s => s.lessonType === filters.lessonType);
  }

  // Filter: Status (available/full)
  if (filters.status === 'available') {
    schedules = schedules.filter(s => 
      (s.bookedStudents?.length || 0) < s.maxStudents
    );
  } else if (filters.status === 'full') {
    schedules = schedules.filter(s => 
      (s.bookedStudents?.length || 0) >= s.maxStudents
    );
  }

  // Sort by date descending (newest first)
  return schedules.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Admin: Advanced filter all schedules
 */
export async function adminFilterSchedules(filters: {
  teacherName?: string;
  teacherId?: string;
  lessonType?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  status?: 'available' | 'full' | 'past' | 'upcoming' | 'all';
}): Promise<PlainSchedule[]> {
  const token = await getAuthToken();
  const user = await requireAuth(token);

  if (user.role !== 'admin') {
    throw new AuthorizationError('Only admins can filter all schedules');
  }

  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.SCHEDULES);

  // Apply teacherId filter at query level if provided
  if (filters.teacherId) {
    query = query.where('teacherId', '==', filters.teacherId);
  }

  // Apply lessonType filter at query level if provided
  if (filters.lessonType) {
    query = query.where('lessonType', '==', filters.lessonType);
  }

  const snapshot = await query.get();

  let schedules = snapshot.docs
    .map((doc) => convertScheduleToPlain(doc))
    .filter((s): s is PlainSchedule => s !== null);

  const now = new Date();

  // Filter: Date range
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    schedules = schedules.filter(s => new Date(s.date) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    schedules = schedules.filter(s => new Date(s.date) <= to);
  }

  // Filter: Location
  if (filters.location) {
    schedules = schedules.filter(s => s.location === filters.location);
  }

  // Filter: Teacher name (partial match)
  if (filters.teacherName) {
    const searchTerm = filters.teacherName.toLowerCase();
    schedules = schedules.filter(s => 
      s.teacherName.toLowerCase().includes(searchTerm)
    );
  }

  // Filter: Status
  if (filters.status === 'available') {
    schedules = schedules.filter(s => 
      (s.bookedStudents?.length || 0) < s.maxStudents && new Date(s.date) > now
    );
  } else if (filters.status === 'full') {
    schedules = schedules.filter(s => 
      (s.bookedStudents?.length || 0) >= s.maxStudents
    );
  } else if (filters.status === 'past') {
    schedules = schedules.filter(s => new Date(s.date) <= now);
  } else if (filters.status === 'upcoming') {
    schedules = schedules.filter(s => new Date(s.date) > now);
  }

  // Sort by date descending (newest first)
  return schedules.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get unique lesson types (for filter dropdowns)
 */
export async function getUniqueLessonTypes(): Promise<string[]> {
  try {
    const snapshot = await adminDb.collection(COLLECTIONS.SCHEDULES).get();
    const lessonTypes = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.lessonType) {
        lessonTypes.add(data.lessonType);
      }
    });

    // Also add default types
    lessonTypes.add('theoretical');
    lessonTypes.add('practical');
    lessonTypes.add('exam_prep');

    return Array.from(lessonTypes).sort();
  } catch (error) {
    console.error('Error getting lesson types:', error);
    return ['theoretical', 'practical', 'exam_prep'];
  }
}

/**
 * Get unique locations (for filter dropdowns)
 */
export async function getUniqueLocations(): Promise<string[]> {
  try {
    const snapshot = await adminDb.collection(COLLECTIONS.SCHEDULES).get();
    const locations = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) {
        locations.add(data.location);
      }
    });

    return Array.from(locations).sort();
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
}

// ============================================================================
// UNIFIED SCHEDULE VIEW
// ============================================================================

export interface CombinedScheduleItem {
  id: string;
  scheduleType: 'individual' | 'group';
  // Common fields
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  teacherId: string;
  teacherName: string;
  // Individual schedule fields
  lessonType?: string;
  maxStudents?: number;
  bookedStudents?: number;
  status?: string;
  // Group schedule fields
  groupId?: string;
  groupName?: string;
  topic?: string;
  attendanceRequired?: boolean;
}

/**
 * Get teacher's combined schedule (individual + group)
 * Returns all schedules sorted by date
 */
export async function getTeacherCombinedSchedule(teacherId: string): Promise<CombinedScheduleItem[]> {
  try {
    const token = await getAuthToken();
    const user = await requireAuth(token);
    
    // Verify permission (own schedules or admin)
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.id).get();
    const userRole = userDoc.data()?.role;

    if (user.id !== teacherId && userRole !== 'admin') {
      throw new AuthorizationError('Unauthorized to view this teacher\'s schedule');
    }

    // Get individual schedules
    const individualSchedulesSnapshot = await adminDb
      .collection(COLLECTIONS.SCHEDULES)
      .where('teacherId', '==', teacherId)
      .get();

    const individualSchedules: CombinedScheduleItem[] = individualSchedulesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data) return null;
        
        const item: CombinedScheduleItem = {
          id: doc.id,
          scheduleType: 'individual',
          date: timestampToISO(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location || undefined,
          notes: data.notes || undefined,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          lessonType: data.lessonType,
          maxStudents: data.maxStudents,
          bookedStudents: Array.isArray(data.bookedStudents) 
            ? data.bookedStudents.length 
            : (data.bookedStudents || 0),
          status: data.status,
        };
        return item;
      })
      .filter((s): s is CombinedScheduleItem => s !== null);

    // Get group schedules
    const groupSchedulesSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_SCHEDULES)
      .where('teacherId', '==', teacherId)
      .get();

    const groupSchedules: CombinedScheduleItem[] = groupSchedulesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data) return null;
        
        const item: CombinedScheduleItem = {
          id: doc.id,
          scheduleType: 'group',
          date: timestampToISO(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location || undefined,
          notes: data.notes || undefined,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          groupId: data.groupId,
          groupName: data.groupName,
          topic: data.topic,
          attendanceRequired: data.attendanceRequired || false,
        };
        return item;
      })
      .filter((s): s is CombinedScheduleItem => s !== null);

    // Combine and sort by date (most recent first)
    const combined = [...individualSchedules, ...groupSchedules].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return combined;
  } catch (error) {
    console.error('Error getting combined schedule:', error);
    throw error;
  }
}
