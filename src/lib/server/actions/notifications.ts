/**
 * Notification Server Actions
 * CRUD operations for the notifications system
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { Notification, CreateNotificationInput, NotificationType } from '@/lib/types/notification';

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

function timestampToISO(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && '_seconds' in value) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }
  return undefined;
}

function convertDocToNotification(doc: FirebaseFirestore.DocumentSnapshot): Notification | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    userId: data.userId,
    type: data.type,
    priority: data.priority || 'normal',
    title: data.title,
    message: data.message,
    read: data.read || false,
    actionUrl: data.actionUrl || undefined,
    actionLabel: data.actionLabel || undefined,
    metadata: data.metadata || undefined,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    readAt: timestampToISO(data.readAt),
    expiresAt: timestampToISO(data.expiresAt),
  };
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create a single notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<{ success: boolean }> {
  try {
    const notificationData = {
      userId: input.userId,
      type: input.type,
      priority: input.priority || 'normal',
      title: input.title,
      message: input.message,
      read: false,
      actionUrl: input.actionUrl || null,
      actionLabel: input.actionLabel || null,
      metadata: input.metadata || null,
      createdAt: Timestamp.now(),
      expiresAt: input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null,
    };

    await adminDb.collection(COLLECTIONS.NOTIFICATIONS).add(notificationData);

    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[], 
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<{ success: boolean; count: number }> {
  try {
    if (userIds.length === 0) return { success: true, count: 0 };

    const batch = adminDb.batch();
    
    userIds.forEach(userId => {
      const notificationData = {
        userId,
        type: input.type,
        priority: input.priority || 'normal',
        title: input.title,
        message: input.message,
        read: false,
        actionUrl: input.actionUrl || null,
        actionLabel: input.actionLabel || null,
        metadata: input.metadata || null,
        createdAt: Timestamp.now(),
        expiresAt: input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null,
      };

      const ref = adminDb.collection(COLLECTIONS.NOTIFICATIONS).doc();
      batch.set(ref, notificationData);
    });

    await batch.commit();

    return { success: true, count: userIds.length };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const user = await getCurrentUser();
    
    // Users can only see their own notifications, admins can see any
    if (user.uid !== userId) {
      const userRole = await getUserRole(user.uid);
      if (userRole !== 'admin') {
        throw new Error('Unauthorized');
      }
    }

    // Get all notifications for the user (limit to recent)
    const snapshot = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const now = new Date();
    
    return snapshot.docs
      .map(doc => convertDocToNotification(doc))
      .filter((n): n is Notification => {
        if (!n) return false;
        // Filter out expired notifications
        if (n.expiresAt && new Date(n.expiresAt) < now) return false;
        return true;
      });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const user = await getCurrentUser();
    
    if (user.uid !== userId) {
      const userRole = await getUserRole(user.uid);
      if (userRole !== 'admin') {
        return 0;
      }
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    const notificationDoc = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .doc(notificationId)
      .get();
      
    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const notificationData = notificationDoc.data()!;
    
    // Verify ownership
    if (notificationData.userId !== user.uid) {
      throw new Error('Unauthorized');
    }

    await notificationDoc.ref.update({
      read: true,
      readAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark as read' 
    };
  }
}

/**
 * Mark all user's notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (user.uid !== userId) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    const batch = adminDb.batch();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: Timestamp.now(),
      });
    });

    await batch.commit();

    return { success: true, count: snapshot.size };
  } catch (error: unknown) {
    console.error('Error marking all as read:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark all as read' 
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    const notificationDoc = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .doc(notificationId)
      .get();
      
    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const notificationData = notificationDoc.data()!;
    
    if (notificationData.userId !== user.uid) {
      throw new Error('Unauthorized');
    }

    await notificationDoc.ref.delete();

    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete' 
    };
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteAllReadNotifications(userId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (user.uid !== userId) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', true)
      .get();

    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    const batch = adminDb.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true, count: snapshot.size };
  } catch (error: unknown) {
    console.error('Error deleting read notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete' 
    };
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES - Easy-to-use functions for specific events
// ============================================================================

// ---- BOOKING NOTIFICATIONS ----

export async function notifyBookingConfirmed(
  bookingId: string, 
  studentId: string, 
  teacherName: string, 
  lessonType: string, 
  date: string
) {
  return createNotification({
    userId: studentId,
    type: 'booking_confirmed',
    priority: 'high',
    title: '✅ Booking Confirmed',
    message: `Your ${lessonType} lesson with ${teacherName} on ${date} has been confirmed.`,
    actionUrl: '/student/bookings',
    actionLabel: 'View Booking',
    metadata: { bookingId },
  });
}

export async function notifyBookingCancelled(
  bookingId: string, 
  studentId: string, 
  lessonType: string, 
  reason: string
) {
  return createNotification({
    userId: studentId,
    type: 'booking_cancelled',
    priority: 'high',
    title: '❌ Booking Cancelled',
    message: `Your ${lessonType} lesson has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
    actionUrl: '/student/bookings',
    actionLabel: 'View Bookings',
    metadata: { bookingId },
  });
}

export async function notifyTeacherNotesAdded(
  bookingId: string, 
  studentId: string, 
  teacherName: string
) {
  return createNotification({
    userId: studentId,
    type: 'booking_teacher_notes',
    priority: 'normal',
    title: '📝 Teacher Notes Added',
    message: `${teacherName} has added notes to your lesson.`,
    actionUrl: '/student/bookings',
    actionLabel: 'View Notes',
    metadata: { bookingId },
  });
}

export async function notifyNewBooking(
  bookingId: string, 
  teacherId: string, 
  studentName: string, 
  lessonType: string, 
  date: string
) {
  return createNotification({
    userId: teacherId,
    type: 'booking_confirmed',
    priority: 'normal',
    title: '📅 New Booking Received',
    message: `${studentName} booked a ${lessonType} lesson on ${date}.`,
    actionUrl: '/teacher/bookings',
    actionLabel: 'View Booking',
    metadata: { bookingId },
  });
}

// ---- GROUP NOTIFICATIONS ----

export async function notifyGroupJoined(
  groupId: string, 
  studentId: string, 
  groupName: string
) {
  return createNotification({
    userId: studentId,
    type: 'group_joined',
    priority: 'normal',
    title: '👥 Joined Group',
    message: `You've successfully joined ${groupName}.`,
    actionUrl: `/student/groups/${groupId}`,
    actionLabel: 'View Group',
    metadata: { groupId },
  });
}

export async function notifyGroupRemoved(
  groupId: string, 
  studentId: string, 
  groupName: string
) {
  return createNotification({
    userId: studentId,
    type: 'group_removed',
    priority: 'high',
    title: '🚪 Removed from Group',
    message: `You've been removed from ${groupName}.`,
    actionUrl: '/student/groups',
    actionLabel: 'View Groups',
    metadata: { groupId },
  });
}

export async function notifyGroupScheduleCreated(
  groupId: string, 
  memberIds: string[], 
  teacherName: string, 
  topic: string, 
  date: string
) {
  return createBulkNotifications(memberIds, {
    type: 'group_schedule_created',
    priority: 'normal',
    title: '📅 New Group Session',
    message: `${teacherName} scheduled: "${topic}" for ${date}.`,
    actionUrl: `/student/groups/${groupId}`,
    actionLabel: 'View Schedule',
    metadata: { groupId },
  });
}

export async function notifyGroupResourceAdded(
  groupId: string, 
  memberIds: string[], 
  teacherName: string, 
  resourceTitle: string
) {
  return createBulkNotifications(memberIds, {
    type: 'group_resource_added',
    priority: 'normal',
    title: '📚 New Resource Added',
    message: `${teacherName} added "${resourceTitle}" to the group.`,
    actionUrl: `/student/groups/${groupId}`,
    actionLabel: 'View Resource',
    metadata: { groupId },
  });
}

export async function notifyTeacherStudentJoined(
  groupId: string, 
  teacherId: string, 
  studentName: string, 
  groupName: string
) {
  return createNotification({
    userId: teacherId,
    type: 'group_student_joined',
    priority: 'low',
    title: '👥 New Group Member',
    message: `${studentName} joined ${groupName}.`,
    actionUrl: `/teacher/groups/${groupId}`,
    actionLabel: 'View Group',
    metadata: { groupId },
  });
}

export async function notifyTeacherStudentLeft(
  groupId: string, 
  teacherId: string, 
  studentName: string, 
  groupName: string
) {
  return createNotification({
    userId: teacherId,
    type: 'group_student_left',
    priority: 'low',
    title: '🚪 Student Left Group',
    message: `${studentName} left ${groupName}.`,
    actionUrl: `/teacher/groups/${groupId}`,
    actionLabel: 'View Group',
    metadata: { groupId },
  });
}

// ---- EXAM REQUEST NOTIFICATIONS ----

export async function notifyExamRequestApproved(
  requestId: string, 
  studentId: string, 
  examType: string, 
  scheduledDate: string
) {
  return createNotification({
    userId: studentId,
    type: 'exam_request_approved',
    priority: 'high',
    title: '✅ Exam Request Approved',
    message: `Your ${examType} exam has been approved for ${scheduledDate}.`,
    actionUrl: '/student/exam-requests',
    actionLabel: 'View Details',
    metadata: { examRequestId: requestId },
  });
}

export async function notifyExamRequestRejected(
  requestId: string, 
  studentId: string, 
  examType: string, 
  reason: string
) {
  return createNotification({
    userId: studentId,
    type: 'exam_request_rejected',
    priority: 'high',
    title: '❌ Exam Request Rejected',
    message: `Your ${examType} exam request was rejected. Reason: ${reason}`,
    actionUrl: '/student/exam-requests',
    actionLabel: 'View Details',
    metadata: { examRequestId: requestId },
  });
}

export async function notifyAdminExamRequestSubmitted(
  requestId: string, 
  adminIds: string[], 
  studentName: string, 
  examType: string
) {
  return createBulkNotifications(adminIds, {
    type: 'exam_request_submitted',
    priority: 'normal',
    title: '📝 New Exam Request',
    message: `${studentName} submitted a ${examType} exam request.`,
    actionUrl: '/admin/exam-requests',
    actionLabel: 'Review Request',
    metadata: { examRequestId: requestId },
  });
}

// ---- QUIZ NOTIFICATIONS ----

export async function notifyQuizResultAvailable(
  attemptId: string, 
  studentId: string, 
  quizTitle: string, 
  passed: boolean, 
  score: number
) {
  return createNotification({
    userId: studentId,
    type: 'quiz_result_available',
    priority: 'normal',
    title: passed ? '✅ Quiz Passed!' : '📊 Quiz Results',
    message: `Your result for "${quizTitle}" is ${score}%. ${passed ? 'Congratulations!' : 'Keep practicing!'}`,
    actionUrl: `/student/quizzes/results/${attemptId}`,
    actionLabel: 'View Results',
    metadata: { quizAttemptId: attemptId, passed, score },
  });
}

export async function notifyNewQuizPublished(
  quizId: string, 
  studentIds: string[], 
  quizTitle: string, 
  teacherName: string
) {
  return createBulkNotifications(studentIds, {
    type: 'quiz_published',
    priority: 'normal',
    title: '🆕 New Quiz Available',
    message: `${teacherName} published a new quiz: "${quizTitle}".`,
    actionUrl: '/student/quizzes',
    actionLabel: 'Take Quiz',
    metadata: { quizId },
  });
}

// ---- LIBRARY NOTIFICATIONS ----

export async function notifyLibraryFileUploaded(
  fileId: string, 
  studentIds: string[], 
  fileName: string, 
  category: string
) {
  return createBulkNotifications(studentIds, {
    type: 'library_file_uploaded',
    priority: 'low',
    title: '📖 New Study Material',
    message: `New file uploaded to ${category}: "${fileName}".`,
    actionUrl: '/student/library',
    actionLabel: 'View Library',
    metadata: { fileId },
  });
}

// ---- ADMIN NOTIFICATIONS ----

export async function notifyAdminAnnouncement(
  userIds: string[], 
  title: string, 
  message: string, 
  actionUrl?: string
) {
  return createBulkNotifications(userIds, {
    type: 'admin_announcement',
    priority: 'high',
    title: `📢 ${title}`,
    message,
    actionUrl: actionUrl || undefined,
    actionLabel: actionUrl ? 'Learn More' : undefined,
  });
}

export async function notifyUserRegistered(
  adminIds: string[],
  userName: string,
  userEmail: string,
  role: string
) {
  return createBulkNotifications(adminIds, {
    type: 'user_registered',
    priority: 'low',
    title: '👤 New User Registered',
    message: `${userName} (${userEmail}) registered as ${role}.`,
    actionUrl: '/admin/users',
    actionLabel: 'View Users',
  });
}
