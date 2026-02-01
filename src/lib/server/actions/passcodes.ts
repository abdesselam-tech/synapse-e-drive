'use server';

import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { getAuthToken, requireAuthWithRole } from './helpers';

// ============================================================================
// TYPES
// ============================================================================

export interface Passcode {
  id: string;
  code: string;
  role: 'teacher' | 'student';
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  usedAt?: string;
  createdAt: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createPasscodeSchema = z.object({
  role: z.enum(['teacher', 'student']),
});

const deletePasscodeSchema = z.object({
  passcodeId: z.string().min(1),
});

const validatePasscodeSchema = z.object({
  code: z.string().min(1).max(20),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random 8-character alphanumeric code (uppercase)
 */
function generatePasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Convert Firestore timestamp to ISO string
 */
function timestampToISO(timestamp: unknown): string {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Create a new passcode (Admin only)
 */
export async function createPasscode(input: { role: 'teacher' | 'student' }): Promise<{
  success: boolean;
  passcodeId?: string;
  code?: string;
  message?: string;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    await requireAuthWithRole(token, 'admin');

    const validated = createPasscodeSchema.parse(input);

    // Generate unique code
    let code = generatePasscode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existingCode = await adminDb
        .collection(COLLECTIONS.PASSCODES)
        .where('code', '==', code)
        .limit(1)
        .get();

      if (existingCode.empty) {
        break;
      }

      code = generatePasscode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: 'Failed to generate unique passcode. Please try again.',
      };
    }

    // Create passcode document
    const passcodeData = {
      code,
      role: validated.role,
      isUsed: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.PASSCODES).add(passcodeData);

    return {
      success: true,
      passcodeId: docRef.id,
      code,
      message: `Passcode created successfully for ${validated.role}`,
    };
  } catch (error) {
    console.error('Error creating passcode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create passcode',
    };
  }
}

/**
 * Get all passcodes (Admin only)
 */
export async function getPasscodes(): Promise<Passcode[]> {
  try {
    const token = await getAuthToken();
    await requireAuthWithRole(token, 'admin');

    const snapshot = await adminDb
      .collection(COLLECTIONS.PASSCODES)
      .orderBy('createdAt', 'desc')
      .get();

    const passcodes: Passcode[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();

      let usedByName: string | undefined;

      // If passcode is used, fetch the user's name
      if (data.isUsed && data.usedBy) {
        try {
          const userDoc = await adminDb
            .collection(COLLECTIONS.USERS)
            .doc(data.usedBy)
            .get();

          if (userDoc.exists) {
            usedByName = userDoc.data()?.displayName || userDoc.data()?.email || 'Unknown';
          }
        } catch {
          usedByName = 'Unknown';
        }
      }

      passcodes.push({
        id: doc.id,
        code: data.code,
        role: data.role,
        isUsed: data.isUsed || false,
        usedBy: data.usedBy,
        usedByName,
        usedAt: data.usedAt ? timestampToISO(data.usedAt) : undefined,
        createdAt: timestampToISO(data.createdAt),
      });
    }

    return passcodes;
  } catch (error) {
    console.error('Error getting passcodes:', error);
    throw error;
  }
}

/**
 * Delete a passcode (Admin only)
 * Only allows deletion if the passcode has not been used
 */
export async function deletePasscode(input: { passcodeId: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    await requireAuthWithRole(token, 'admin');

    const validated = deletePasscodeSchema.parse(input);

    const passcodeDoc = await adminDb
      .collection(COLLECTIONS.PASSCODES)
      .doc(validated.passcodeId)
      .get();

    if (!passcodeDoc.exists) {
      return {
        success: false,
        error: 'Passcode not found',
      };
    }

    const passcodeData = passcodeDoc.data();

    if (passcodeData?.isUsed) {
      return {
        success: false,
        error: 'Cannot delete a passcode that has been used',
      };
    }

    await adminDb.collection(COLLECTIONS.PASSCODES).doc(validated.passcodeId).delete();

    return {
      success: true,
      message: 'Passcode deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting passcode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete passcode',
    };
  }
}

/**
 * Validate a passcode (NO auth required - used during registration)
 * Does NOT mark the passcode as used - that happens after successful registration
 */
export async function validatePasscode(input: { code: string }): Promise<{
  valid: boolean;
  role?: 'teacher' | 'student';
  passcodeId?: string;
  error?: string;
}> {
  try {
    const validated = validatePasscodeSchema.parse(input);

    // Normalize code to uppercase
    const normalizedCode = validated.code.toUpperCase().trim();

    const snapshot = await adminDb
      .collection(COLLECTIONS.PASSCODES)
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'Invalid passcode',
      };
    }

    const passcodeDoc = snapshot.docs[0];
    const passcodeData = passcodeDoc.data();

    if (passcodeData.isUsed) {
      return {
        valid: false,
        error: 'This passcode has already been used',
      };
    }

    return {
      valid: true,
      role: passcodeData.role as 'teacher' | 'student',
      passcodeId: passcodeDoc.id,
    };
  } catch (error) {
    console.error('Error validating passcode:', error);
    return {
      valid: false,
      error: 'Failed to validate passcode',
    };
  }
}

/**
 * Mark a passcode as used (internal function, called after successful registration)
 */
export async function markPasscodeAsUsed(passcodeId: string, userId: string): Promise<void> {
  try {
    await adminDb.collection(COLLECTIONS.PASSCODES).doc(passcodeId).update({
      isUsed: true,
      usedBy: userId,
      usedAt: Timestamp.now(),
    });
  } catch (error) {
    // Log but don't throw - the user was already created
    console.error('Error marking passcode as used:', error);
  }
}
