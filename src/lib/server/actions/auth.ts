'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { ValidationError } from '@/lib/utils/errors';
import { validatePasscode, markPasscodeAsUsed } from './passcodes';

const signupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().min(1).max(100).optional(),
  passcode: z.string().min(1, 'Passcode is required'),
});

export async function registerUser(input: z.infer<typeof signupInputSchema>) {
  const validation = signupInputSchema.safeParse(input);
  if (!validation.success) {
    throw new ValidationError('Invalid signup data', validation.error.flatten().fieldErrors);
  }

  const { email, password, displayName, passcode } = validation.data;

  // Step 1: Validate the passcode BEFORE creating any user
  const passcodeValidation = await validatePasscode({ code: passcode });
  
  if (!passcodeValidation.valid) {
    throw new ValidationError(passcodeValidation.error || 'Invalid passcode');
  }

  // Use the role from the passcode, NOT from client input
  const role = passcodeValidation.role!;
  const passcodeId = passcodeValidation.passcodeId!;

  try {
    // Step 2: Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // Step 3: Create Firestore user document
    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      email,
      displayName: displayName || null,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Step 4: Mark passcode as used (after successful user creation)
    // This is done in a try-catch so if it fails, the user is still valid
    try {
      await markPasscodeAsUsed(passcodeId, userRecord.uid);
    } catch (passcodeError) {
      console.error('Failed to mark passcode as used:', passcodeError);
      // Don't throw - the user was created successfully
    }

    return { uid: userRecord.uid, role };
  } catch (error) {
    const code =
      error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;

    if (code === 'auth/email-already-exists') {
      throw new ValidationError('An account with this email already exists');
    }

    throw new ValidationError('Failed to create account');
  }
}

export async function createSession(idToken: string) {
  const validation = z.string().min(1).safeParse(idToken);
  if (!validation.success) {
    throw new ValidationError('Invalid authentication token');
  }

  await adminAuth.verifyIdToken(idToken);

  const cookieStore = await cookies();
  cookieStore.set('auth-token', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
}

// ============================================================================
// FIRST ADMIN FLOW
// ============================================================================

/**
 * Check if any admin exists in the system
 * NO auth required - used to determine if first admin setup is needed
 */
export async function checkIfAdminsExist(): Promise<{ hasAdmin: boolean }> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    return { hasAdmin: !snapshot.empty };
  } catch (error) {
    console.error('Error checking for admins:', error);
    // If there's an error, assume admin exists to prevent unauthorized access
    return { hasAdmin: true };
  }
}

const firstAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

/**
 * Create the first admin account
 * NO auth required, but ONLY works if no admin exists
 */
export async function createFirstAdmin(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validation = firstAdminSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      return { success: false, error: firstError || 'Invalid input' };
    }

    const { email, password, name } = validation.data;

    // Step 1: Check if an admin already exists
    const { hasAdmin } = await checkIfAdminsExist();
    if (hasAdmin) {
      return {
        success: false,
        error: 'An admin already exists. Please use the normal signup flow.',
      };
    }

    // Step 2: Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Step 3: Create Firestore user document with admin role
    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      email,
      displayName: name,
      role: 'admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating first admin:', error);

    const code =
      error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;

    if (code === 'auth/email-already-exists') {
      return { success: false, error: 'An account with this email already exists' };
    }

    return { success: false, error: 'Failed to create admin account' };
  }
}
