/**
 * Server Action Helpers
 * Utilities for server actions
 */

import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { AuthenticationError, NotFoundError } from '@/lib/utils/errors';
import type { User, UserRole } from '@/lib/types';
import { requireRole, requireAnyRole } from '@/lib/utils/roles';

/**
 * Get current user from Firebase Admin Auth token
 */
export async function getCurrentUserFromToken(token: string | null): Promise<User | null> {
  if (!token) return null;

  try {
    const { adminAuth } = await import('@/lib/firebase/admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      ...userData,
      createdAt: userData?.createdAt?.toDate() ?? new Date(),
      updatedAt: userData?.updatedAt?.toDate() ?? new Date(),
    } as User;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * Require authentication or throw error
 */
export async function requireAuth(token: string | null): Promise<User> {
  if (!token) {
    throw new AuthenticationError('Authentication required');
  }

  const user = await getCurrentUserFromToken(token);
  if (!user) {
    throw new AuthenticationError('Invalid authentication token');
  }

  return user;
}

/**
 * Require specific role or throw error
 */
export async function requireAuthWithRole(
  token: string | null,
  requiredRole: UserRole
): Promise<User> {
  const user = await requireAuth(token);
  requireRole(user.role, requiredRole);
  return user;
}

/**
 * Require any of the roles or throw error
 */
export async function requireAuthWithAnyRole(
  token: string | null,
  requiredRoles: UserRole[]
): Promise<User> {
  const user = await requireAuth(token);
  requireAnyRole(user.role, requiredRoles);
  return user;
}

/**
 * Get document by ID or throw NotFoundError
 */
export async function getDocumentOrThrow<T>(
  collection: string,
  docId: string
): Promise<T & { id: string }> {
  const doc = await adminDb.collection(collection).doc(docId).get();

  if (!doc.exists) {
    throw new NotFoundError(`${collection} document`);
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as T & { id: string };
}

/**
 * Convert Firestore timestamp to Date
 */
export function toDate(timestamp: unknown): Date {
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    const withToDate = timestamp as { toDate: () => Date };
    return withToDate.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}
