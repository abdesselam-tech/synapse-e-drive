/**
 * Activity Feed Server Actions
 * Track and display group activity for cross-role presence
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { ActivityEntry, CreateActivityInput, ActivityType } from '@/lib/types/activity';

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

function timestampToNumber(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value && typeof value === 'object' && '_seconds' in value) {
    return (value as { _seconds: number })._seconds * 1000;
  }
  return Date.now();
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Write an activity entry to the feed
 * Called by other server actions after successful operations
 */
export async function writeActivityEntry(input: CreateActivityInput): Promise<{
  success: boolean;
  activityId?: string;
  error?: string;
}> {
  try {
    const activityData = {
      groupId: input.groupId,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata || {},
      createdAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.ACTIVITY_FEED).add(activityData);

    return { success: true, activityId: docRef.id };
  } catch (error) {
    console.error('Error writing activity entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write activity',
    };
  }
}

/**
 * Get activity feed for a group
 * Returns most recent entries
 */
export async function getGroupActivity(groupId: string, limit: number = 20): Promise<ActivityEntry[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.ACTIVITY_FEED)
      .where('groupId', '==', groupId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId: data.groupId,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        type: data.type as ActivityType,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Error getting group activity:', error);
    return [];
  }
}

/**
 * Get activity feed for multiple groups (for teachers with multiple groups)
 */
export async function getMultiGroupActivity(groupIds: string[], limit: number = 30): Promise<ActivityEntry[]> {
  try {
    if (groupIds.length === 0) return [];
    
    // Firestore 'in' query supports max 30 values
    const limitedGroupIds = groupIds.slice(0, 30);
    
    const snapshot = await adminDb
      .collection(COLLECTIONS.ACTIVITY_FEED)
      .where('groupId', 'in', limitedGroupIds)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId: data.groupId,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        type: data.type as ActivityType,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Error getting multi-group activity:', error);
    return [];
  }
}

/**
 * Get activity for a specific student (their own actions)
 */
export async function getStudentActivity(studentId: string, limit: number = 20): Promise<ActivityEntry[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.ACTIVITY_FEED)
      .where('actorId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId: data.groupId,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        type: data.type as ActivityType,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Error getting student activity:', error);
    return [];
  }
}

// ============================================================================
// ACTIVITY HELPERS - Convenience functions for common activity types
// ============================================================================

/**
 * Record a booking activity
 */
export async function recordBookingActivity(
  groupId: string,
  studentId: string,
  studentName: string,
  lessonDate: string,
  lessonType: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: studentId,
    actorName: studentName,
    actorRole: 'student',
    type: 'booking',
    title: 'Nouvelle réservation',
    message: `${studentName} a réservé une leçon de ${lessonType} pour le ${lessonDate}`,
    metadata: { lessonDate, lessonType },
  });
}

/**
 * Record a rank up activity
 */
export async function recordRankUpActivity(
  groupId: string,
  studentId: string,
  studentName: string,
  newRank: number,
  newRankLabel: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: studentId,
    actorName: studentName,
    actorRole: 'student',
    type: 'rank_up',
    title: 'Promotion de rang',
    message: `🎉 ${studentName} a atteint le rang ${newRankLabel}`,
    metadata: { newRank, newRankLabel },
  });
}

/**
 * Record a quiz completion activity
 */
export async function recordQuizCompletedActivity(
  groupId: string,
  studentId: string,
  studentName: string,
  quizTitle: string,
  score: number
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: studentId,
    actorName: studentName,
    actorRole: 'student',
    type: 'quiz_completed',
    title: 'Quiz terminé',
    message: `${studentName} a terminé "${quizTitle}" — Score: ${score}%`,
    metadata: { quizTitle, score },
  });
}

/**
 * Record a resource added activity
 */
export async function recordResourceAddedActivity(
  groupId: string,
  teacherId: string,
  teacherName: string,
  resourceTitle: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: teacherId,
    actorName: teacherName,
    actorRole: 'teacher',
    type: 'resource_added',
    title: 'Nouvelle ressource',
    message: `📚 ${teacherName} a ajouté "${resourceTitle}"`,
    metadata: { resourceTitle },
  });
}

/**
 * Record an exam form created activity
 */
export async function recordExamFormCreatedActivity(
  groupId: string,
  teacherId: string,
  teacherName: string,
  formTitle: string,
  examDate: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: teacherId,
    actorName: teacherName,
    actorRole: 'teacher',
    type: 'exam_form_created',
    title: 'Formulaire d\'examen disponible',
    message: `📝 "${formTitle}" est maintenant ouvert pour le ${examDate}`,
    metadata: { formTitle, examDate },
  });
}

/**
 * Record an exam request activity
 */
export async function recordExamRequestActivity(
  groupId: string,
  studentId: string,
  studentName: string,
  examDate: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: studentId,
    actorName: studentName,
    actorRole: 'student',
    type: 'exam_requested',
    title: 'Demande d\'examen',
    message: `${studentName} a demandé un examen pour le ${examDate}`,
    metadata: { examDate },
  });
}

/**
 * Record a student joined activity
 */
export async function recordStudentJoinedActivity(
  groupId: string,
  studentId: string,
  studentName: string,
  groupName: string
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: studentId,
    actorName: studentName,
    actorRole: 'student',
    type: 'student_joined',
    title: 'Nouveau membre',
    message: `👋 ${studentName} a rejoint le groupe`,
    metadata: { groupName },
  });
}

/**
 * Record attendance marked activity
 */
export async function recordAttendanceMarkedActivity(
  groupId: string,
  teacherId: string,
  teacherName: string,
  date: string,
  presentCount: number,
  absentCount: number
): Promise<void> {
  await writeActivityEntry({
    groupId,
    actorId: teacherId,
    actorName: teacherName,
    actorRole: 'teacher',
    type: 'attendance_marked',
    title: 'Présence enregistrée',
    message: `📋 Présence du ${date}: ${presentCount} présent(s), ${absentCount} absent(s)`,
    metadata: { date, presentCount, absentCount },
  });
}
