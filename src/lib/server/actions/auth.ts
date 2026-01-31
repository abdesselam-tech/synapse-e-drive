'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { ValidationError } from '@/lib/utils/errors';
const signupRoleSchema = z.enum(['student', 'teacher']);

const signupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().min(1).max(100).optional(),
  role: signupRoleSchema,
});

export async function registerUser(input: z.infer<typeof signupInputSchema>) {
  const validation = signupInputSchema.safeParse(input);
  if (!validation.success) {
    throw new ValidationError('Invalid signup data', validation.error.flatten().fieldErrors);
  }

  const { email, password, displayName, role } = validation.data;

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      email,
      displayName: displayName || null,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

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
