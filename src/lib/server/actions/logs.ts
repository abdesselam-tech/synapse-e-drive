'use server';

/**
 * Audit Logs Server Actions
 * Track all platform actions for admin oversight
 */

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { LogEntry, LogFilters, CreateLogInput, LogAction } from '@/lib/types/logs';

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
 * Write a log entry
 * Called by other server actions to record significant actions
 */
export async function writeLog(input: CreateLogInput): Promise<{
  success: boolean;
  logId?: string;
  error?: string;
}> {
  try {
    const logData = {
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      action: input.action,
      targetId: input.targetId || null,
      targetCollection: input.targetCollection || null,
      targetName: input.targetName || null,
      details: input.details || {},
      createdAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.LOGS).add(logData);

    return { success: true, logId: docRef.id };
  } catch (error) {
    console.error('Error writing log:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write log',
    };
  }
}

/**
 * Get logs with filters (admin only)
 */
export async function getLogs(filters: LogFilters = {}): Promise<{
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin(user.uid);
    
    if (!userIsAdmin) {
      return { logs: [], total: 0, hasMore: false };
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    // Build query
    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.LOGS);

    // Apply filters
    if (filters.action) {
      if (Array.isArray(filters.action)) {
        query = query.where('action', 'in', filters.action.slice(0, 10)); // Firestore limit
      } else {
        query = query.where('action', '==', filters.action);
      }
    }

    if (filters.actorId) {
      query = query.where('actorId', '==', filters.actorId);
    }

    if (filters.actorRole) {
      query = query.where('actorRole', '==', filters.actorRole);
    }

    if (filters.targetId) {
      query = query.where('targetId', '==', filters.targetId);
    }

    if (filters.targetCollection) {
      query = query.where('targetCollection', '==', filters.targetCollection);
    }

    if (filters.dateFrom) {
      query = query.where('createdAt', '>=', Timestamp.fromMillis(filters.dateFrom));
    }

    if (filters.dateTo) {
      query = query.where('createdAt', '<=', Timestamp.fromMillis(filters.dateTo));
    }

    // Order and limit
    query = query.orderBy('createdAt', 'desc').limit(limit + 1);

    // Note: Firestore doesn't support offset directly, so we fetch extra and slice
    // For proper pagination, use cursor-based pagination in production
    const snapshot = await query.get();

    const logs: LogEntry[] = snapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        action: data.action as LogAction,
        targetId: data.targetId,
        targetCollection: data.targetCollection,
        targetName: data.targetName,
        details: data.details || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });

    // Filter by search query if provided (client-side filter)
    let filteredLogs = logs;
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      filteredLogs = logs.filter(log => 
        log.actorName.toLowerCase().includes(searchLower) ||
        (log.targetName && log.targetName.toLowerCase().includes(searchLower))
      );
    }

    return {
      logs: filteredLogs,
      total: filteredLogs.length,
      hasMore: snapshot.docs.length > limit,
    };
  } catch (error) {
    console.error('Error getting logs:', error);
    return { logs: [], total: 0, hasMore: false };
  }
}

/**
 * Get logs for a specific target entity
 */
export async function getLogsForTarget(
  targetId: string,
  targetCollection: string,
  limit: number = 50
): Promise<LogEntry[]> {
  try {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin(user.uid);
    
    if (!userIsAdmin) {
      return [];
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.LOGS)
      .where('targetId', '==', targetId)
      .where('targetCollection', '==', targetCollection)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        action: data.action as LogAction,
        targetId: data.targetId,
        targetCollection: data.targetCollection,
        targetName: data.targetName,
        details: data.details || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Error getting logs for target:', error);
    return [];
  }
}

/**
 * Get recent logs for dashboard overview
 */
export async function getRecentLogs(limit: number = 20): Promise<LogEntry[]> {
  try {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin(user.uid);
    
    if (!userIsAdmin) {
      return [];
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.LOGS)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        action: data.action as LogAction,
        targetId: data.targetId,
        targetCollection: data.targetCollection,
        targetName: data.targetName,
        details: data.details || {},
        createdAt: timestampToNumber(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Error getting recent logs:', error);
    return [];
  }
}

// ============================================================================
// LOG HELPERS - Convenience functions for common log types
// ============================================================================

/**
 * Log a user action
 */
export async function logUserAction(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'teacher' | 'student' | 'system',
  action: LogAction,
  targetId: string,
  targetName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole,
    action,
    targetId,
    targetCollection: 'users',
    targetName,
    details,
  });
}

/**
 * Log a schedule action
 */
export async function logScheduleAction(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'teacher' | 'student' | 'system',
  action: LogAction,
  scheduleId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole,
    action,
    targetId: scheduleId,
    targetCollection: 'schedules',
    details,
  });
}

/**
 * Log a group action
 */
export async function logGroupAction(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'teacher' | 'student' | 'system',
  action: LogAction,
  groupId: string,
  groupName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole,
    action,
    targetId: groupId,
    targetCollection: 'groups',
    targetName: groupName,
    details,
  });
}

/**
 * Log an exam action
 */
export async function logExamAction(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'teacher' | 'student' | 'system',
  action: LogAction,
  examRequestId: string,
  studentName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole,
    action,
    targetId: examRequestId,
    targetCollection: 'examRequests',
    targetName: studentName,
    details,
  });
}

/**
 * Log a ranking action
 */
export async function logRankingAction(
  actorId: string,
  actorName: string,
  action: LogAction,
  studentId: string,
  studentName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole: 'admin',
    action,
    targetId: studentId,
    targetCollection: 'users',
    targetName: studentName,
    details,
  });
}

/**
 * Log a library action
 */
export async function logLibraryAction(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'teacher',
  action: LogAction,
  resourceId: string,
  resourceName: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await writeLog({
    actorId,
    actorName,
    actorRole,
    action,
    targetId: resourceId,
    targetCollection: 'library',
    targetName: resourceName,
    details,
  });
}
