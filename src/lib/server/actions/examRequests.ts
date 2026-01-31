/**
 * Exam Request Server Actions
 * Complete workflow for exam request management
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createExamRequestSchema,
  reviewExamRequestSchema,
  updateExamRequestSchema,
  cancelExamRequestSchema,
} from '../validators/examRequest';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { ExamRequest } from '@/lib/types/examRequest';
import {
  notifyExamRequestApproved,
  notifyExamRequestRejected,
  notifyAdminExamRequestSubmitted,
} from './notifications';

/**
 * Helper: Convert Timestamp to ISO string
 */
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
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

/**
 * Convert Firestore document to plain ExamRequest object
 */
function convertRequestToPlain(doc: FirebaseFirestore.DocumentSnapshot): ExamRequest | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    studentId: data.studentId,
    studentName: data.studentName,
    studentEmail: data.studentEmail,
    examType: data.examType,
    status: data.status,
    requestedDate: timestampToISO(data.requestedDate),
    notes: data.notes || undefined,
    reviewedBy: data.reviewedBy || undefined,
    reviewedByName: data.reviewedByName || undefined,
    reviewedAt: timestampToISO(data.reviewedAt),
    adminNotes: data.adminNotes || undefined,
    scheduledDate: timestampToISO(data.scheduledDate),
    rejectionReason: data.rejectionReason || undefined,
    completedAt: timestampToISO(data.completedAt),
    examResult: data.examResult || undefined,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    updatedAt: timestampToISO(data.updatedAt) || new Date().toISOString(),
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
 * Create new exam request (Student only)
 */
export async function createExamRequest(input: unknown): Promise<{
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createExamRequestSchema.parse(input);
    const user = await getCurrentUser();

    // Verify user is a student
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      throw new Error('Only students can request exams');
    }

    const userData = userDoc.data()!;

    // Check for duplicate pending request for same exam type
    const existingRequest = await adminDb
      .collection(COLLECTIONS.EXAM_REQUESTS)
      .where('studentId', '==', user.uid)
      .where('examType', '==', validated.examType)
      .where('status', 'in', ['pending', 'approved', 'scheduled'])
      .get();

    if (!existingRequest.empty) {
      throw new Error('You already have a pending or scheduled request for this exam type');
    }

    const requestData = {
      studentId: user.uid,
      studentName: userData.displayName || userData.email,
      studentEmail: userData.email,
      examType: validated.examType,
      status: 'pending',
      requestedDate: validated.requestedDate ? Timestamp.fromDate(new Date(validated.requestedDate)) : null,
      notes: validated.notes || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).add(requestData);

    // Notify all admins
    try {
      const adminsSnapshot = await adminDb
        .collection(COLLECTIONS.USERS)
        .where('role', '==', 'admin')
        .get();

      const adminIds = adminsSnapshot.docs.map(doc => doc.id);

      if (adminIds.length > 0) {
        await notifyAdminExamRequestSubmitted(
          docRef.id,
          adminIds,
          userData.displayName || userData.email || 'A student',
          validated.examType
        );
      }
    } catch (notifError) {
      console.error('Error sending exam request notification to admins:', notifError);
    }

    return {
      success: true,
      requestId: docRef.id,
      message: 'Exam request submitted successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating exam request:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit exam request';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get student's exam requests
 */
export async function getStudentExamRequests(studentId: string): Promise<ExamRequest[]> {
  try {
    const user = await getCurrentUser();

    // Students can only see their own requests
    if (user.uid !== studentId) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      const role = userDoc.data()?.role;
      if (role !== 'admin') {
        throw new Error('Unauthorized');
      }
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.EXAM_REQUESTS)
      .where('studentId', '==', studentId)
      .get();

    const requests = snapshot.docs
      .map(doc => convertRequestToPlain(doc))
      .filter((r): r is ExamRequest => r !== null);

    // Sort by creation date (newest first)
    return requests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting student exam requests:', error);
    throw error;
  }
}

/**
 * Get all exam requests (Admin only)
 */
export async function getAllExamRequests(filters?: {
  status?: string;
  examType?: string;
}): Promise<ExamRequest[]> {
  try {
    const user = await getCurrentUser();

    // Verify user is admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Only admins can view all exam requests');
    }

    const snapshot = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).get();

    let requests = snapshot.docs
      .map(doc => convertRequestToPlain(doc))
      .filter((r): r is ExamRequest => r !== null);

    // Apply filters
    if (filters?.status) {
      requests = requests.filter(r => r.status === filters.status);
    }

    if (filters?.examType) {
      requests = requests.filter(r => r.examType === filters.examType);
    }

    // Sort by creation date (newest first)
    return requests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting all exam requests:', error);
    throw error;
  }
}

/**
 * Get exam request by ID
 */
export async function getExamRequestById(requestId: string): Promise<ExamRequest> {
  try {
    const user = await getCurrentUser();

    const requestDoc = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) {
      throw new Error('Exam request not found');
    }

    const requestData = requestDoc.data()!;

    // Check access: student can only view their own, admin can view all
    if (requestData.studentId !== user.uid) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      const role = userDoc.data()?.role;
      if (role !== 'admin') {
        throw new Error('Unauthorized');
      }
    }

    const request = convertRequestToPlain(requestDoc);
    if (!request) throw new Error('Invalid request data');

    return request;
  } catch (error) {
    console.error('Error getting exam request:', error);
    throw error;
  }
}

/**
 * Review exam request (Admin - Approve/Reject)
 */
export async function reviewExamRequest(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = reviewExamRequestSchema.parse(input);
    const user = await getCurrentUser();

    // Verify user is admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Only admins can review exam requests');
    }

    const userData = userDoc.data()!;

    const requestDoc = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId).get();
    if (!requestDoc.exists) {
      throw new Error('Exam request not found');
    }

    const requestData = requestDoc.data()!;

    if (requestData.status !== 'pending') {
      throw new Error('Only pending requests can be reviewed');
    }

    const updates: Record<string, unknown> = {
      reviewedBy: user.uid,
      reviewedByName: userData.displayName || userData.email,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (validated.action === 'approve') {
      updates.status = 'scheduled';
      updates.scheduledDate = Timestamp.fromDate(new Date(validated.scheduledDate!));
      if (validated.adminNotes) {
        updates.adminNotes = validated.adminNotes;
      }
    } else {
      updates.status = 'rejected';
      updates.rejectionReason = validated.rejectionReason;
      if (validated.adminNotes) {
        updates.adminNotes = validated.adminNotes;
      }
    }

    await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId).update(updates);

    // Send notification to student
    try {
      if (validated.action === 'approve' && validated.scheduledDate) {
        const formattedDate = new Date(validated.scheduledDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        await notifyExamRequestApproved(
          validated.requestId,
          requestData.studentId,
          requestData.examType,
          formattedDate
        );
      } else if (validated.action === 'reject' && validated.rejectionReason) {
        await notifyExamRequestRejected(
          validated.requestId,
          requestData.studentId,
          requestData.examType,
          validated.rejectionReason
        );
      }
    } catch (notifError) {
      console.error('Error sending exam request review notification:', notifError);
    }

    return {
      success: true,
      message: validated.action === 'approve' ? 'Exam request approved and scheduled' : 'Exam request rejected',
    };
  } catch (error: unknown) {
    console.error('Error reviewing exam request:', error);
    const message = error instanceof Error ? error.message : 'Failed to review exam request';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update exam request (Admin - Update details or mark as completed)
 */
export async function updateExamRequest(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateExamRequestSchema.parse(input);
    const user = await getCurrentUser();

    // Verify user is admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Only admins can update exam requests');
    }

    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (validated.status) {
      updates.status = validated.status;
    }

    if (validated.scheduledDate) {
      updates.scheduledDate = Timestamp.fromDate(new Date(validated.scheduledDate));
    }

    if (validated.adminNotes !== undefined) {
      updates.adminNotes = validated.adminNotes;
    }

    if (validated.examResult) {
      updates.examResult = validated.examResult;
      updates.status = 'completed';
      updates.completedAt = Timestamp.now();
    }

    await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId).update(updates);

    return {
      success: true,
      message: 'Exam request updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating exam request:', error);
    const message = error instanceof Error ? error.message : 'Failed to update exam request';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Cancel exam request (Student - only if pending, approved, or scheduled)
 */
export async function cancelExamRequest(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = cancelExamRequestSchema.parse(input);
    const user = await getCurrentUser();

    const requestDoc = await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId).get();
    if (!requestDoc.exists) {
      throw new Error('Exam request not found');
    }

    const requestData = requestDoc.data()!;

    // Check ownership
    if (requestData.studentId !== user.uid) {
      throw new Error('Unauthorized');
    }

    // Can only cancel pending, approved, or scheduled requests
    if (!['pending', 'approved', 'scheduled'].includes(requestData.status)) {
      throw new Error('Cannot cancel this request');
    }

    await adminDb.collection(COLLECTIONS.EXAM_REQUESTS).doc(validated.requestId).update({
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: 'Exam request cancelled',
    };
  } catch (error: unknown) {
    console.error('Error cancelling exam request:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel exam request';
    return {
      success: false,
      error: message,
    };
  }
}
