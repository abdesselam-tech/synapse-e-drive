/**
 * Profile Server Actions
 * User profile management operations
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { updateProfileSchema, changePasswordSchema, uploadProfilePictureSchema } from '../validators/profile';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { UserProfile } from '@/lib/types/user';

/**
 * Helper: Convert Timestamp to ISO string
 */
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
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
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
 * Convert Firestore user document to plain object
 */
function convertUserToPlain(doc: FirebaseFirestore.DocumentSnapshot): UserProfile | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    email: data.email,
    displayName: data.displayName || null,
    role: data.role,
    phoneNumber: data.phoneNumber || undefined,
    profilePictureUrl: data.profilePictureUrl || undefined,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    emergencyContact: data.emergencyContact || undefined,
    bio: data.bio || undefined,
    qualifications: data.qualifications || undefined,
    yearsOfExperience: data.yearsOfExperience !== undefined ? data.yearsOfExperience : undefined,
  };
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  try {
    const user = await getCurrentUser();
    
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const profile = convertUserToPlain(userDoc);
    if (!profile) throw new Error('Invalid user data');

    return profile;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
}

/**
 * Get user profile by ID (for admins/teachers viewing student profiles)
 */
export async function getUserProfileById(userId: string): Promise<UserProfile> {
  try {
    const currentUser = await getCurrentUser();
    const currentUserDoc = await adminDb.collection(COLLECTIONS.USERS).doc(currentUser.uid).get();
    const currentUserRole = currentUserDoc.data()?.role;

    // Only admins and teachers can view other profiles
    if (currentUser.uid !== userId && currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
      throw new Error('Unauthorized');
    }

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const profile = convertUserToPlain(userDoc);
    if (!profile) throw new Error('Invalid user data');

    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateProfileSchema.parse(input);
    const user = await getCurrentUser();

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userRole = userDoc.data()?.role;

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (validated.displayName !== undefined) {
      updates.displayName = validated.displayName;
      
      // Also update Firebase Auth displayName
      try {
        await adminAuth.updateUser(user.uid, {
          displayName: validated.displayName,
        });
      } catch (authError) {
        console.error('Error updating Firebase Auth displayName:', authError);
      }
    }

    if (validated.phoneNumber !== undefined && validated.phoneNumber !== '') {
      updates.phoneNumber = validated.phoneNumber;
    } else if (validated.phoneNumber === '') {
      updates.phoneNumber = null;
    }

    // Student-specific fields
    if (userRole === 'student' && validated.emergencyContact !== undefined) {
      updates.emergencyContact = validated.emergencyContact;
    }

    // Teacher-specific fields
    if (userRole === 'teacher') {
      if (validated.bio !== undefined) updates.bio = validated.bio;
      if (validated.qualifications !== undefined) updates.qualifications = validated.qualifications;
      if (validated.yearsOfExperience !== undefined) updates.yearsOfExperience = validated.yearsOfExperience;
    }

    await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).update(updates);

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = changePasswordSchema.parse(input);
    const user = await getCurrentUser();

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    // Update password in Firebase Auth
    await adminAuth.updateUser(user.uid, {
      password: validated.newPassword,
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error: unknown) {
    console.error('Error changing password:', error);
    const message = error instanceof Error ? error.message : 'Failed to change password';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Save profile picture metadata
 */
export async function saveProfilePicture(input: unknown): Promise<{
  success: boolean;
  message?: string;
  profilePictureUrl?: string;
  error?: string;
}> {
  try {
    const validated = uploadProfilePictureSchema.parse(input);
    const user = await getCurrentUser();

    await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).update({
      profilePictureUrl: validated.downloadUrl,
      updatedAt: Timestamp.now(),
    });

    // Also update Firebase Auth photoURL
    try {
      await adminAuth.updateUser(user.uid, {
        photoURL: validated.downloadUrl,
      });
    } catch (authError) {
      console.error('Error updating Firebase Auth photoURL:', authError);
    }

    return {
      success: true,
      message: 'Profile picture updated successfully',
      profilePictureUrl: validated.downloadUrl,
    };
  } catch (error: unknown) {
    console.error('Error saving profile picture:', error);
    const message = error instanceof Error ? error.message : 'Failed to save profile picture';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete profile picture
 */
export async function deleteProfilePicture(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).update({
      profilePictureUrl: null,
      updatedAt: Timestamp.now(),
    });

    try {
      await adminAuth.updateUser(user.uid, {
        photoURL: undefined,
      });
    } catch (authError) {
      console.error('Error updating Firebase Auth photoURL:', authError);
    }

    return {
      success: true,
      message: 'Profile picture removed',
    };
  } catch (error: unknown) {
    console.error('Error deleting profile picture:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete profile picture';
    return {
      success: false,
      error: message,
    };
  }
}
