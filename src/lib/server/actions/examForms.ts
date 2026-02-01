'use server';

/**
 * Exam Forms Server Actions
 * Teacher creates exam forms, students request, admin decides
 */

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { createNotification } from './notifications';
import { writeActivityEntry, recordExamFormCreatedActivity, recordExamRequestActivity } from './activityFeed';
import { writeLog } from './logs';
import { rankUpStudent } from './ranking';
import type { ExamForm, ExamRequest, CreateExamFormInput, CreateExamRequestInput, ReviewExamRequestInput, SetExamResultInput } from '@/lib/types/examRequest';

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

async function getUserData(userId: string): Promise<{
  id: string;
  role: string;
  displayName?: string;
  email?: string;
  groupId?: string;
  rank?: number;
  [key: string]: unknown;
} | null> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) return null;
  const data = userDoc.data()!;
  return { id: userId, ...data } as {
    id: string;
    role: string;
    displayName?: string;
    email?: string;
    groupId?: string;
    rank?: number;
    [key: string]: unknown;
  };
}

async function isAdmin(userId: string): Promise<boolean> {
  const userData = await getUserData(userId);
  return userData?.role === 'admin';
}

async function isTeacher(userId: string): Promise<boolean> {
  const userData = await getUserData(userId);
  return userData?.role === 'teacher';
}

async function isStudent(userId: string): Promise<boolean> {
  const userData = await getUserData(userId);
  return userData?.role === 'student';
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
// SCHEMAS
// ============================================================================

const createExamFormSchema = z.object({
  title: z.string().min(1).max(200),
  examType: z.enum(['theory', 'practical', 'road-test']),
  examDate: z.string().min(1), // ISO date string
  examTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  maxRequests: z.number().int().min(1).max(50),
});

const createExamRequestSchema = z.object({
  formId: z.string().min(1),
  groupId: z.string().min(1),
  studentNotes: z.string().max(500).optional(),
});

const reviewExamRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
});

const setExamResultSchema = z.object({
  requestId: z.string().min(1),
  result: z.enum(['passed', 'failed']),
  resultNotes: z.string().max(500).optional(),
});

// ============================================================================
// EXAM FORM ACTIONS (Teacher)
// ============================================================================

/**
 * Create an exam form (Teacher only)
 * Creates a form in groups/{groupId}/examForms
 */
export async function createExamForm(
  groupId: string,
  input: unknown
): Promise<{
  success: boolean;
  formId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createExamFormSchema.parse(input);
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);

    if (!userData || (userData.role !== 'teacher' && userData.role !== 'admin')) {
      return { success: false, error: 'Permission denied. Only teachers can create exam forms.' };
    }

    // Verify teacher owns this group (or is admin)
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }

    const groupData = groupDoc.data()!;
    if (userData.role === 'teacher' && groupData.teacherId !== user.uid) {
      return { success: false, error: 'You can only create exam forms for your own groups' };
    }

    // Create the exam form
    const formData = {
      teacherId: user.uid,
      teacherName: userData.displayName || 'Unknown',
      examDate: validated.examDate,
      examTime: validated.examTime,
      title: validated.title,
      examType: validated.examType,
      isOpen: true,
      maxRequests: validated.maxRequests,
      currentRequests: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const formRef = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(groupId)
      .collection(COLLECTIONS.EXAM_FORMS)
      .add(formData);

    // Notify all students in the group
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('status', '==', 'active')
      .get();

    const notificationPromises = membersSnapshot.docs.map(async (memberDoc) => {
      const memberData = memberDoc.data();
      return createNotification({
        userId: memberData.studentId,
        type: 'exam_request_approved' as 'booking_confirmed', // Using existing type
        priority: 'high',
        title: '📝 Nouveau formulaire d\'examen disponible',
        message: `"${validated.title}" est maintenant ouvert pour le ${validated.examDate}. Soumettez votre demande!`,
        actionUrl: `/student/groups/${groupId}`,
      });
    });

    await Promise.all(notificationPromises);

    // Record activity
    await recordExamFormCreatedActivity(
      groupId,
      user.uid,
      userData.displayName || 'Unknown',
      validated.title,
      validated.examDate
    );

    // Write log
    await writeLog({
      actorId: user.uid,
      actorName: userData.displayName || 'Unknown',
      actorRole: userData.role,
      action: 'exam_form_created',
      targetId: formRef.id,
      targetCollection: 'examForms',
      targetName: validated.title,
      details: { groupId, examDate: validated.examDate, maxRequests: validated.maxRequests },
    });

    return {
      success: true,
      formId: formRef.id,
      message: `Exam form "${validated.title}" created successfully`,
    };
  } catch (error) {
    console.error('Error creating exam form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create exam form',
    };
  }
}

/**
 * Get exam forms for a group
 */
export async function getExamFormsForGroup(groupId: string): Promise<ExamForm[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(groupId)
      .collection(COLLECTIONS.EXAM_FORMS)
      .orderBy('examDate', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        examDate: data.examDate,
        examTime: data.examTime,
        title: data.title,
        examType: data.examType,
        isOpen: data.isOpen,
        maxRequests: data.maxRequests,
        currentRequests: data.currentRequests,
        createdAt: timestampToNumber(data.createdAt),
        updatedAt: timestampToNumber(data.updatedAt),
      };
    });
  } catch (error) {
    console.error('Error getting exam forms:', error);
    return [];
  }
}

/**
 * Close an exam form (Teacher/Admin)
 */
export async function closeExamForm(
  groupId: string,
  formId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);

    if (!userData || (userData.role !== 'teacher' && userData.role !== 'admin')) {
      return { success: false, error: 'Permission denied' };
    }

    const formRef = adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(groupId)
      .collection(COLLECTIONS.EXAM_FORMS)
      .doc(formId);

    const formDoc = await formRef.get();
    if (!formDoc.exists) {
      return { success: false, error: 'Exam form not found' };
    }

    const formData = formDoc.data()!;
    if (userData.role === 'teacher' && formData.teacherId !== user.uid) {
      return { success: false, error: 'You can only close your own exam forms' };
    }

    await formRef.update({
      isOpen: false,
      updatedAt: Timestamp.now(),
    });

    // Write log
    await writeLog({
      actorId: user.uid,
      actorName: userData.displayName || 'Unknown',
      actorRole: userData.role,
      action: 'exam_form_closed',
      targetId: formId,
      targetCollection: 'examForms',
      targetName: formData.title,
      details: { groupId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error closing exam form:', error);
    return { success: false, error: 'Failed to close exam form' };
  }
}

// ============================================================================
// EXAM REQUEST ACTIONS (Student)
// ============================================================================

/**
 * Request an exam (Student only)
 */
export async function requestExam(input: unknown): Promise<{
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createExamRequestSchema.parse(input);
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);

    if (!userData || userData.role !== 'student') {
      return { success: false, error: 'Only students can request exams' };
    }

    // Verify student is in the group
    if (userData.groupId !== validated.groupId) {
      return { success: false, error: 'You are not a member of this group' };
    }

    // Get the exam form
    const formRef = adminDb
      .collection(COLLECTIONS.GROUPS)
      .doc(validated.groupId)
      .collection(COLLECTIONS.EXAM_FORMS)
      .doc(validated.formId);

    const formDoc = await formRef.get();
    if (!formDoc.exists) {
      return { success: false, error: 'Exam form not found' };
    }

    const formData = formDoc.data()!;

    // Validate form is open
    if (!formData.isOpen) {
      return { success: false, error: 'This exam form is no longer accepting requests' };
    }

    // Check max requests
    if (formData.currentRequests >= formData.maxRequests) {
      return { success: false, error: 'This exam form has reached maximum capacity' };
    }

    // Check if student already requested this exam
    const existingRequest = await adminDb
      .collection(COLLECTIONS.EXAM_REQUESTS)
      .where('studentId', '==', user.uid)
      .where('formId', '==', validated.formId)
      .limit(1)
      .get();

    if (!existingRequest.empty) {
      return { success: false, error: 'You have already requested this exam' };
    }

    // Create the exam request
    const requestData = {
      studentId: user.uid,
      studentName: userData.displayName || 'Unknown',
      studentEmail: userData.email || '',
      groupId: validated.groupId,
      teacherId: formData.teacherId,
      teacherName: formData.teacherName,
      formId: validated.formId,
      examType: formData.examType,
      status: 'pending',
      examDate: formData.examDate,
      examTime: formData.examTime,
      studentNotes: validated.studentNotes || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const requestRef = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).add(requestData);

    // Increment current requests on the form
    await formRef.update({
      currentRequests: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });

    // Notify admin(s)
    const adminsSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('role', '==', 'admin')
      .get();

    const adminNotifications = adminsSnapshot.docs.map(adminDoc => 
      createNotification({
        userId: adminDoc.id,
        type: 'exam_request_submitted' as 'booking_confirmed',
        priority: 'high',
        title: '📋 Nouvelle demande d\'examen',
        message: `${userData.displayName} a demandé un examen pour le ${formData.examDate}`,
        actionUrl: '/admin/evaluations',
      })
    );

    await Promise.all(adminNotifications);

    // Record activity
    await recordExamRequestActivity(
      validated.groupId,
      user.uid,
      userData.displayName || 'Unknown',
      formData.examDate
    );

    // Write log
    await writeLog({
      actorId: user.uid,
      actorName: userData.displayName || 'Unknown',
      actorRole: 'student',
      action: 'exam_requested',
      targetId: requestRef.id,
      targetCollection: 'examRequests',
      targetName: formData.title,
      details: { groupId: validated.groupId, examDate: formData.examDate },
    });

    return {
      success: true,
      requestId: requestRef.id,
      message: 'Exam request submitted successfully',
    };
  } catch (error) {
    console.error('Error requesting exam:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request exam',
    };
  }
}

/**
 * Get exam requests for a student
 */
export async function getStudentExamRequests(studentId: string): Promise<ExamRequest[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.EXAM_REQUESTS)
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        groupId: data.groupId,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        formId: data.formId,
        examType: data.examType,
        status: data.status,
        examDate: data.examDate,
        examTime: data.examTime,
        studentNotes: data.studentNotes,
        reviewedBy: data.reviewedBy,
        reviewedByName: data.reviewedByName,
        reviewedAt: data.reviewedAt,
        adminNotes: data.adminNotes,
        rejectionReason: data.rejectionReason,
        result: data.result,
        resultNotes: data.resultNotes,
        resultSetBy: data.resultSetBy,
        resultSetAt: data.resultSetAt,
        createdAt: timestampToNumber(data.createdAt),
        updatedAt: timestampToNumber(data.updatedAt),
      };
    });
  } catch (error) {
    console.error('Error getting student exam requests:', error);
    return [];
  }
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

/**
 * Get all pending exam requests (Admin only)
 */
export async function getPendingExamRequests(): Promise<ExamRequest[]> {
  try {
    const user = await getCurrentUser();
    if (!(await isAdmin(user.uid))) {
      return [];
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.EXAM_REQUESTS)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        groupId: data.groupId,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        formId: data.formId,
        examType: data.examType,
        status: data.status,
        examDate: data.examDate,
        examTime: data.examTime,
        studentNotes: data.studentNotes,
        createdAt: timestampToNumber(data.createdAt),
        updatedAt: timestampToNumber(data.updatedAt),
      };
    });
  } catch (error) {
    console.error('Error getting pending exam requests:', error);
    return [];
  }
}

/**
 * Review an exam request (Admin only)
 */
export async function reviewExamRequest(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = reviewExamRequestSchema.parse(input);
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);

    if (!userData || userData.role !== 'admin') {
      return { success: false, error: 'Only admins can review exam requests' };
    }

    const requestRef = adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return { success: false, error: 'Exam request not found' };
    }

    const requestData = requestDoc.data()!;

    if (requestData.status !== 'pending') {
      return { success: false, error: 'This request has already been reviewed' };
    }

    const newStatus = validated.action === 'approve' ? 'approved' : 'rejected';

    await requestRef.update({
      status: newStatus,
      reviewedBy: user.uid,
      reviewedByName: userData.displayName || 'Admin',
      reviewedAt: Timestamp.now(),
      adminNotes: validated.adminNotes || null,
      rejectionReason: validated.action === 'reject' ? validated.rejectionReason : null,
      updatedAt: Timestamp.now(),
    });

    // Notify student
    const notificationTitle = validated.action === 'approve' 
      ? '✅ Demande d\'examen approuvée'
      : '❌ Demande d\'examen refusée';
    
    const notificationMessage = validated.action === 'approve'
      ? `Votre demande d'examen pour le ${requestData.examDate} a été approuvée.`
      : `Votre demande d'examen a été refusée. ${validated.rejectionReason || ''}`;

    await createNotification({
      userId: requestData.studentId,
      type: validated.action === 'approve' ? 'exam_request_approved' as 'booking_confirmed' : 'exam_request_rejected' as 'booking_cancelled',
      priority: 'high',
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: '/student/exam-requests',
    });

    // Write log
    await writeLog({
      actorId: user.uid,
      actorName: userData.displayName || 'Admin',
      actorRole: 'admin',
      action: validated.action === 'approve' ? 'exam_approved' : 'exam_rejected',
      targetId: validated.requestId,
      targetCollection: 'examRequests',
      targetName: requestData.studentName,
      details: { 
        examDate: requestData.examDate, 
        adminNotes: validated.adminNotes,
        rejectionReason: validated.rejectionReason,
      },
    });

    return {
      success: true,
      message: `Exam request ${validated.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    };
  } catch (error) {
    console.error('Error reviewing exam request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review exam request',
    };
  }
}

/**
 * Set exam result (Admin only)
 * Automatically ranks up student if passed
 */
export async function setExamResult(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = setExamResultSchema.parse(input);
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);

    if (!userData || userData.role !== 'admin') {
      return { success: false, error: 'Only admins can set exam results' };
    }

    const requestRef = adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return { success: false, error: 'Exam request not found' };
    }

    const requestData = requestDoc.data()!;

    if (requestData.status !== 'approved') {
      return { success: false, error: 'Can only set results for approved requests' };
    }

    const newStatus = validated.result === 'passed' ? 'passed' : 'failed';

    await requestRef.update({
      status: newStatus,
      result: validated.result,
      resultNotes: validated.resultNotes || null,
      resultSetBy: user.uid,
      resultSetAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Notify student
    const notificationTitle = validated.result === 'passed'
      ? '🎉 Félicitations! Examen réussi!'
      : '📝 Résultat d\'examen';
    
    const notificationMessage = validated.result === 'passed'
      ? `Vous avez réussi votre examen du ${requestData.examDate}! Votre rang va être mis à jour.`
      : `Malheureusement, vous n'avez pas réussi l'examen du ${requestData.examDate}. ${validated.resultNotes || 'Continuez à vous entraîner!'}`;

    await createNotification({
      userId: requestData.studentId,
      type: 'exam_result' as 'booking_confirmed',
      priority: 'high',
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: '/student/dashboard',
    });

    // Auto rank-up if passed
    if (validated.result === 'passed') {
      const rankUpResult = await rankUpStudent({
        studentId: requestData.studentId,
        groupId: requestData.groupId,
        reason: `Passed exam on ${requestData.examDate}`,
      });

      if (rankUpResult.success) {
        // Record rank-up activity
        await writeActivityEntry({
          groupId: requestData.groupId,
          actorId: requestData.studentId,
          actorName: requestData.studentName,
          actorRole: 'student',
          type: 'rank_up',
          title: 'Promotion de rang',
          message: `🎉 ${requestData.studentName} a atteint le rang ${rankUpResult.newRankLabel}`,
          metadata: { newRank: rankUpResult.newRank, newRankLabel: rankUpResult.newRankLabel },
        });
      }
    }

    // Write log
    await writeLog({
      actorId: user.uid,
      actorName: userData.displayName || 'Admin',
      actorRole: 'admin',
      action: 'exam_result_set',
      targetId: validated.requestId,
      targetCollection: 'examRequests',
      targetName: requestData.studentName,
      details: { 
        examDate: requestData.examDate, 
        result: validated.result,
        resultNotes: validated.resultNotes,
      },
    });

    return {
      success: true,
      message: `Exam result set to ${validated.result}${validated.result === 'passed' ? ' - student ranked up!' : ''}`,
    };
  } catch (error) {
    console.error('Error setting exam result:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set exam result',
    };
  }
}

/**
 * Get student evaluation data for admin review
 */
export async function getStudentEvaluationData(studentId: string): Promise<{
  student: {
    id: string;
    name: string;
    email: string;
    groupId?: string;
    groupName?: string;
    rank?: number;
    rankLabel?: string;
  };
  quizScores: Array<{
    quizId: string;
    quizTitle: string;
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: number;
  }>;
  teacherNotes: string[];
  groupProgress: {
    studentProgress: number;
    groupAverage: number;
  };
} | null> {
  try {
    const user = await getCurrentUser();
    if (!(await isAdmin(user.uid))) {
      return null;
    }

    // Get student data
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(studentId).get();
    if (!studentDoc.exists) return null;

    const studentData = studentDoc.data()!;
    
    // Get group info
    let groupName: string | undefined;
    let ranks: Array<{ level: number; label: string }> = [];
    if (studentData.groupId) {
      const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(studentData.groupId).get();
      if (groupDoc.exists) {
        const groupData = groupDoc.data()!;
        groupName = groupData.name;
        ranks = groupData.ranks || [];
      }
    }

    const rankLabel = ranks.find(r => r.level === studentData.rank)?.label;

    // Get quiz scores (last 5)
    const quizAttemptsSnapshot = await adminDb
      .collection(COLLECTIONS.QUIZ_ATTEMPTS)
      .where('studentId', '==', studentId)
      .orderBy('completedAt', 'desc')
      .limit(5)
      .get();

    const quizScores = quizAttemptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        quizId: data.quizId,
        quizTitle: data.quizTitle || 'Quiz',
        score: data.score || 0,
        totalPoints: data.totalPoints || 100,
        percentage: Math.round((data.score / (data.totalPoints || 100)) * 100),
        completedAt: timestampToNumber(data.completedAt),
      };
    });

    // Get teacher notes (from group member record)
    const memberSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    const teacherNotes: string[] = [];
    if (!memberSnapshot.empty) {
      const memberData = memberSnapshot.docs[0].data();
      if (memberData.phaseNotes) {
        teacherNotes.push(memberData.phaseNotes);
      }
    }

    // Calculate group progress (simplified)
    const studentProgress = quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, q) => sum + q.percentage, 0) / quizScores.length)
      : 0;

    return {
      student: {
        id: studentId,
        name: studentData.displayName || 'Unknown',
        email: studentData.email || '',
        groupId: studentData.groupId,
        groupName,
        rank: studentData.rank,
        rankLabel,
      },
      quizScores,
      teacherNotes,
      groupProgress: {
        studentProgress,
        groupAverage: 65, // Placeholder - would need to calculate from all group members
      },
    };
  } catch (error) {
    console.error('Error getting student evaluation data:', error);
    return null;
  }
}
