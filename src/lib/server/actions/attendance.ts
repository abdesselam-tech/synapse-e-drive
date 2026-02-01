/**
 * Attendance Server Actions
 * Mark and track group session attendance
 */

'use server';

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { createNotification } from './notifications';

// ============================================================================
// HELPERS
// ============================================================================

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}

async function getUserRole(userId: string): Promise<string | null> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  return userDoc.exists ? userDoc.data()?.role : null;
}

async function isAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === 'admin';
}

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
  if (value && typeof value === 'object' && '_seconds' in value) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

// ============================================================================
// SCHEMAS
// ============================================================================

const markAttendanceSchema = z.object({
  groupScheduleId: z.string().min(1),
  presentStudentIds: z.array(z.string()),
});

const groupIdSchema = z.object({
  groupId: z.string().min(1),
});

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceRecord {
  id: string;
  groupScheduleId: string;
  groupId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent';
  markedBy: string;
  markedAt: string;
  createdAt: string;
}

export interface TodaySession {
  id: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: 'not_started' | 'pending' | 'marked';
}

export interface AttendanceHistoryEntry {
  date: string;
  presentCount: number;
  absentCount: number;
  absentStudentNames: string[];
}

export interface StudentNeedingContact {
  studentId: string;
  studentName: string;
  studentEmail: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  consecutiveAbsences: number;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Mark attendance for a group session
 * Teacher (group owner) or admin only
 */
export async function markGroupAttendance(input: unknown): Promise<{
  success: boolean;
  presentCount?: number;
  absentCount?: number;
  absentStudents?: { studentId: string; studentName: string }[];
  error?: string;
}> {
  try {
    const validated = markAttendanceSchema.parse(input);
    const user = await getCurrentUser();

    // 1. Read the groupSchedule document
    const scheduleDoc = await adminDb
      .collection(COLLECTIONS.GROUP_SCHEDULES)
      .doc(validated.groupScheduleId)
      .get();

    if (!scheduleDoc.exists) {
      return { success: false, error: 'Session not found' };
    }

    const scheduleData = scheduleDoc.data()!;

    // 2. Read the group and verify permission
    const groupDoc = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(scheduleData.groupId)
      .get();

    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }

    const groupData = groupDoc.data()!;
    const userIsAdmin = await isAdmin(user.uid);

    if (groupData.teacherId !== user.uid && !userIsAdmin) {
      return { success: false, error: 'Permission denied' };
    }

    // 3. Time gate — session must have started
    const today = new Date().toISOString().split('T')[0];
    const scheduleDate = scheduleData.date;
    
    // Only check time if the session is today
    if (scheduleDate === today) {
      const [h, m] = (scheduleData.startTime as string).split(':').map(Number);
      const sessionStart = new Date();
      sessionStart.setHours(h, m, 0, 0);
      
      if (new Date() < sessionStart) {
        return { 
          success: false, 
          error: `Session hasn't started yet. Opens at ${scheduleData.startTime}` 
        };
      }
    }

    // 4. Duplicate guard — attendance must not already exist
    const existingAttendance = await adminDb
      .collection(COLLECTIONS.ATTENDANCE)
      .where('groupScheduleId', '==', validated.groupScheduleId)
      .limit(1)
      .get();

    if (!existingAttendance.empty) {
      return { success: false, error: 'Attendance already marked for this session' };
    }

    // 5. Fetch all active group members
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', scheduleData.groupId)
      .where('status', '==', 'active')
      .get();

    if (membersSnapshot.empty) {
      return { success: false, error: 'No active members in this group' };
    }

    // 6. Calculate session duration in hours
    const [startH, startM] = (scheduleData.startTime as string).split(':').map(Number);
    const [endH, endM] = (scheduleData.endTime as string).split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const sessionDurationHours = (endMinutes - startMinutes) / 60;

    // 7. Process each member
    const batch = adminDb.batch();
    const presentStudentIds = new Set(validated.presentStudentIds);
    const absentStudents: { studentId: string; studentName: string }[] = [];
    let presentCount = 0;
    let absentCount = 0;

    // Get all admin IDs for notifications
    const adminsSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('role', '==', 'admin')
      .get();
    const adminIds = adminsSnapshot.docs.map(doc => doc.id);

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const studentId = memberData.studentId;
      const studentName = memberData.studentName || 'Unknown Student';
      const isPresent = presentStudentIds.has(studentId);

      // Create attendance document
      const attendanceRef = adminDb.collection(COLLECTIONS.ATTENDANCE).doc();
      batch.set(attendanceRef, {
        groupScheduleId: validated.groupScheduleId,
        groupId: scheduleData.groupId,
        teacherId: scheduleData.teacherId,
        studentId: studentId,
        studentName: studentName,
        date: scheduleData.date,
        status: isPresent ? 'present' : 'absent',
        markedBy: user.uid,
        markedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      if (isPresent) {
        // Present: reset consecutive absences, increment code hours
        batch.update(memberDoc.ref, {
          consecutiveAbsences: 0,
          codeHoursCompleted: FieldValue.increment(sessionDurationHours),
        });
        presentCount++;
      } else {
        // Absent: increment consecutive absences
        const currentAbsences = memberData.consecutiveAbsences || 0;
        const newAbsenceCount = currentAbsences + 1;
        
        batch.update(memberDoc.ref, {
          consecutiveAbsences: FieldValue.increment(1),
        });
        
        absentStudents.push({ studentId, studentName });
        absentCount++;

        // Notify the student
        await createNotification({
          userId: studentId,
          type: 'attendance-absent' as 'booking_confirmed', // Use existing type
          title: `Absent — ${groupData.name}`,
          message: `You were marked absent for ${groupData.name} on ${scheduleData.date}. If this is wrong, contact your teacher.`,
          actionUrl: `/student/groups/${scheduleData.groupId}`,
        });

        // If 3+ consecutive absences, notify admins
        if (newAbsenceCount >= 3) {
          for (const adminId of adminIds) {
            await createNotification({
              userId: adminId,
              type: 'admin_announcement' as 'booking_confirmed', // Use existing type
              priority: 'high',
              title: '⚠️ Student Needs Contact',
              message: `${studentName} has been absent ${newAbsenceCount} consecutive times in ${groupData.name}. Please contact them.`,
              actionUrl: '/admin/dashboard',
            });
          }
        }
      }
    }

    await batch.commit();

    return {
      success: true,
      presentCount,
      absentCount,
      absentStudents,
    };
  } catch (error) {
    console.error('Error marking attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance',
    };
  }
}

/**
 * Get today's sessions for a group
 * Teacher (group owner) or admin only
 */
export async function getTodaySessionsForGroup(input: unknown): Promise<TodaySession[]> {
  try {
    const validated = groupIdSchema.parse(input);
    const user = await getCurrentUser();

    // Read the group and verify permission
    const groupDoc = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(validated.groupId)
      .get();

    if (!groupDoc.exists) {
      return [];
    }

    const groupData = groupDoc.data()!;
    const userIsAdmin = await isAdmin(user.uid);

    if (groupData.teacherId !== user.uid && !userIsAdmin) {
      return [];
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Query group schedules for today
    const schedulesSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_SCHEDULES)
      .where('groupId', '==', validated.groupId)
      .where('date', '==', today)
      .get();

    const sessions: TodaySession[] = [];

    for (const doc of schedulesSnapshot.docs) {
      const data = doc.data();
      
      // Parse start time
      const [h, m] = (data.startTime as string).split(':').map(Number);
      const sessionStart = new Date();
      sessionStart.setHours(h, m, 0, 0);

      let status: TodaySession['status'] = 'not_started';

      if (now >= sessionStart) {
        // Check if attendance already marked
        const attendanceSnapshot = await adminDb
          .collection(COLLECTIONS.ATTENDANCE)
          .where('groupScheduleId', '==', doc.id)
          .limit(1)
          .get();

        status = attendanceSnapshot.empty ? 'pending' : 'marked';
      }

      sessions.push({
        id: doc.id,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic || data.title || 'Session',
        status,
      });
    }

    // Sort by start time
    sessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return sessions;
  } catch (error) {
    console.error('Error getting today sessions:', error);
    return [];
  }
}

/**
 * Get attendance history for a group
 * Teacher (group owner) or admin only
 */
export async function getGroupAttendanceHistory(input: unknown): Promise<AttendanceHistoryEntry[]> {
  try {
    const validated = groupIdSchema.parse(input);
    const user = await getCurrentUser();

    // Read the group and verify permission
    const groupDoc = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(validated.groupId)
      .get();

    if (!groupDoc.exists) {
      return [];
    }

    const groupData = groupDoc.data()!;
    const userIsAdmin = await isAdmin(user.uid);

    if (groupData.teacherId !== user.uid && !userIsAdmin) {
      return [];
    }

    // Query attendance records
    const attendanceSnapshot = await adminDb
      .collection(COLLECTIONS.ATTENDANCE)
      .where('groupId', '==', validated.groupId)
      .orderBy('date', 'desc')
      .limit(300) // Limit to prevent huge queries
      .get();

    // Group by date
    const byDate = new Map<string, { present: number; absent: number; absentNames: string[] }>();

    for (const doc of attendanceSnapshot.docs) {
      const data = doc.data();
      const date = data.date;

      if (!byDate.has(date)) {
        byDate.set(date, { present: 0, absent: 0, absentNames: [] });
      }

      const entry = byDate.get(date)!;
      if (data.status === 'present') {
        entry.present++;
      } else {
        entry.absent++;
        entry.absentNames.push(data.studentName);
      }
    }

    // Convert to array and limit to 30 unique dates
    const result: AttendanceHistoryEntry[] = [];
    for (const [date, counts] of byDate.entries()) {
      if (result.length >= 30) break;
      result.push({
        date,
        presentCount: counts.present,
        absentCount: counts.absent,
        absentStudentNames: counts.absentNames,
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting attendance history:', error);
    return [];
  }
}

/**
 * Get students needing contact (3+ consecutive absences)
 * Admin only
 */
export async function getStudentsNeedingContact(): Promise<StudentNeedingContact[]> {
  try {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin(user.uid);

    if (!userIsAdmin) {
      return [];
    }

    // Query group members with 3+ consecutive absences
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('consecutiveAbsences', '>=', 3)
      .where('status', '==', 'active')
      .get();

    if (membersSnapshot.empty) {
      return [];
    }

    const results: StudentNeedingContact[] = [];

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();

      // Get student info
      const studentDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(memberData.studentId)
        .get();
      
      const studentData = studentDoc.exists ? studentDoc.data() : null;

      // Get group info
      const groupDoc = await adminDb
        .collection(COLLECTIONS.GROUPS)
        .doc(memberData.groupId)
        .get();
      
      const groupData = groupDoc.exists ? groupDoc.data() : null;

      // Get teacher info
      let teacherName = 'Unknown Teacher';
      if (groupData?.teacherId) {
        const teacherDoc = await adminDb
          .collection(COLLECTIONS.USERS)
          .doc(groupData.teacherId)
          .get();
        
        if (teacherDoc.exists) {
          teacherName = teacherDoc.data()?.displayName || 'Unknown Teacher';
        }
      }

      results.push({
        studentId: memberData.studentId,
        studentName: studentData?.displayName || memberData.studentName || 'Unknown Student',
        studentEmail: studentData?.email || 'No email',
        groupId: memberData.groupId,
        groupName: groupData?.name || 'Unknown Group',
        teacherName,
        consecutiveAbsences: memberData.consecutiveAbsences,
      });
    }

    // Sort by consecutive absences (highest first)
    results.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);

    return results;
  } catch (error) {
    console.error('Error getting students needing contact:', error);
    return [];
  }
}
