/**
 * User Management Server Actions
 * Admin-only operations for managing users
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { notifyBookingCancelled, notifyGroupRemoved } from './notifications';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  role: z.enum(['admin', 'teacher', 'student']),
  phoneNumber: z.string().optional(),
});

const updateUserSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
});

const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export type UserData = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
};

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
 * Check if user is admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  return userDoc.exists && userDoc.data()?.role === 'admin';
}

/**
 * Handle cascading changes when a user's role changes
 * - If changing FROM student: cancel their bookings
 * - If changing FROM teacher: cancel their schedules
 */
async function handleUserRoleChange(userId: string, oldRole: string, newRole: string) {
  try {
    // If changing FROM student role, cancel their bookings
    if (oldRole === 'student' && newRole !== 'student') {
      const bookingsSnapshot = await adminDb
        .collection(COLLECTIONS.BOOKINGS)
        .where('studentId', '==', userId)
        .where('status', '==', 'confirmed')
        .get();

      if (bookingsSnapshot.size > 0) {
        const batch = adminDb.batch();
        
        for (const doc of bookingsSnapshot.docs) {
          const bookingData = doc.data();
          
          // Cancel the booking
          batch.update(doc.ref, {
            status: 'cancelled',
            cancelledAt: Timestamp.now(),
            cancelReason: 'User role changed',
          });

          // Update schedule capacity
          if (bookingData.scheduleId) {
            const scheduleRef = adminDb.collection(COLLECTIONS.SCHEDULES).doc(bookingData.scheduleId);
            batch.update(scheduleRef, {
              bookedStudents: FieldValue.increment(-1),
            });
          }
        }

        await batch.commit();
        console.log(`Cancelled ${bookingsSnapshot.size} bookings for user ${userId} due to role change`);
      }
    }

    // If changing FROM teacher role, cancel their schedules
    if (oldRole === 'teacher' && newRole !== 'teacher') {
      const schedulesSnapshot = await adminDb
        .collection(COLLECTIONS.SCHEDULES)
        .where('teacherId', '==', userId)
        .where('status', '!=', 'cancelled')
        .get();

      if (schedulesSnapshot.size > 0) {
        const batch = adminDb.batch();
        
        for (const doc of schedulesSnapshot.docs) {
          batch.update(doc.ref, {
            status: 'cancelled',
            cancelledAt: Timestamp.now(),
            cancelReason: 'Teacher role changed',
          });
        }

        await batch.commit();
        console.log(`Cancelled ${schedulesSnapshot.size} schedules for user ${userId} due to role change`);
      }
    }
  } catch (error) {
    console.error('Error handling role change cascading effects:', error);
    // Don't throw - this is a secondary operation
  }
}

/**
 * Clean up user's related records when deleting
 */
async function cleanupUserRecords(userId: string, userRole: string) {
  try {
    // ========================================================================
    // STUDENT CLEANUP
    // ========================================================================
    if (userRole === 'student') {
      // 1. Cancel/delete all bookings
      const bookingsSnapshot = await adminDb
        .collection(COLLECTIONS.BOOKINGS)
        .where('studentId', '==', userId)
        .get();

      if (bookingsSnapshot.size > 0) {
        const batch = adminDb.batch();
        
        for (const doc of bookingsSnapshot.docs) {
          const bookingData = doc.data();
          
          // If booking is confirmed, update schedule capacity and notify teacher
          if (bookingData.status === 'confirmed') {
            if (bookingData.scheduleId) {
              const scheduleRef = adminDb.collection(COLLECTIONS.SCHEDULES).doc(bookingData.scheduleId);
              batch.update(scheduleRef, {
                bookedStudents: FieldValue.increment(-1),
              });
            }
            
            // Notify teacher about cancellation
            try {
              await notifyBookingCancelled(
                doc.id,
                bookingData.teacherId,
                bookingData.lessonType || 'Lesson',
                'Student account deleted'
              );
            } catch (e) {
              console.error('Notification error:', e);
            }
          }

          // Delete the booking
          batch.delete(doc.ref);
        }

        await batch.commit();
        console.log(`Deleted ${bookingsSnapshot.size} bookings for deleted student ${userId}`);
      }

      // 2. Remove from all groups
      const groupMembersSnapshot = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('studentId', '==', userId)
        .where('status', '==', 'active')
        .get();

      if (groupMembersSnapshot.size > 0) {
        const batch = adminDb.batch();
        
        for (const doc of groupMembersSnapshot.docs) {
          const memberData = doc.data();
          
          // Decrement group count
          const groupRef = adminDb.collection(COLLECTIONS.GROUPS).doc(memberData.groupId);
          batch.update(groupRef, {
            currentStudents: FieldValue.increment(-1),
          });
          
          batch.delete(doc.ref);
        }

        await batch.commit();
        console.log(`Removed from ${groupMembersSnapshot.size} groups for deleted student ${userId}`);
      }

      // 3. Delete quiz attempts
      const attemptsSnapshot = await adminDb
        .collection(COLLECTIONS.QUIZ_ATTEMPTS)
        .where('studentId', '==', userId)
        .get();

      if (attemptsSnapshot.size > 0) {
        const batch = adminDb.batch();
        attemptsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${attemptsSnapshot.size} quiz attempts for deleted student ${userId}`);
      }

      // 4. Delete exam requests
      const examRequestsSnapshot = await adminDb
        .collection(COLLECTIONS.EXAM_REQUESTS)
        .where('studentId', '==', userId)
        .get();

      if (examRequestsSnapshot.size > 0) {
        const batch = adminDb.batch();
        examRequestsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${examRequestsSnapshot.size} exam requests for deleted student ${userId}`);
      }
    }

    // ========================================================================
    // TEACHER CLEANUP
    // ========================================================================
    if (userRole === 'teacher') {
      // 1. Find all schedules and cancel all their bookings
      const schedulesSnapshot = await adminDb
        .collection(COLLECTIONS.SCHEDULES)
        .where('teacherId', '==', userId)
        .get();

      for (const scheduleDoc of schedulesSnapshot.docs) {
        // Find all bookings for this schedule
        const bookingsSnapshot = await adminDb
          .collection(COLLECTIONS.BOOKINGS)
          .where('scheduleId', '==', scheduleDoc.id)
          .where('status', '==', 'confirmed')
          .get();

        if (bookingsSnapshot.size > 0) {
          const batch = adminDb.batch();
          
          for (const bookingDoc of bookingsSnapshot.docs) {
            const bookingData = bookingDoc.data();
            
            // Notify student about cancellation
            try {
              await notifyBookingCancelled(
                bookingDoc.id,
                bookingData.studentId,
                bookingData.lessonType || 'Lesson',
                'Teacher account deleted'
              );
            } catch (e) {
              console.error('Notification error:', e);
            }
            
            batch.update(bookingDoc.ref, {
              status: 'cancelled',
              cancelledAt: Timestamp.now(),
              cancellationReason: 'Teacher account deleted',
            });
          }

          await batch.commit();
        }
      }

      // Delete all schedules
      if (schedulesSnapshot.size > 0) {
        const batch = adminDb.batch();
        schedulesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${schedulesSnapshot.size} schedules for deleted teacher ${userId}`);
      }

      // 2. Unassign from all groups (set teacherId to null)
      const groupsSnapshot = await adminDb
        .collection(COLLECTIONS.GROUPS)
        .where('teacherId', '==', userId)
        .get();

      if (groupsSnapshot.size > 0) {
        const batch = adminDb.batch();
        groupsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            teacherId: null,
            teacherName: 'Unassigned',
            updatedAt: Timestamp.now(),
          });
        });
        await batch.commit();
        console.log(`Unassigned ${groupsSnapshot.size} groups from deleted teacher ${userId}`);
      }

      // 3. Delete their quizzes
      const quizzesSnapshot = await adminDb
        .collection(COLLECTIONS.QUIZZES)
        .where('createdBy', '==', userId)
        .get();

      if (quizzesSnapshot.size > 0) {
        const batch = adminDb.batch();
        quizzesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${quizzesSnapshot.size} quizzes for deleted teacher ${userId}`);
      }

      // 4. Delete their library files metadata (actual files remain in storage)
      const librarySnapshot = await adminDb
        .collection(COLLECTIONS.LIBRARY)
        .where('uploadedBy', '==', userId)
        .get();

      if (librarySnapshot.size > 0) {
        const batch = adminDb.batch();
        librarySnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${librarySnapshot.size} library files for deleted teacher ${userId}`);
      }
    }

    // ========================================================================
    // COMMON CLEANUP (all roles)
    // ========================================================================
    
    // Delete all notifications for this user
    const notificationsSnapshot = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .get();

    if (notificationsSnapshot.size > 0) {
      const batch = adminDb.batch();
      notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${notificationsSnapshot.size} notifications for deleted user ${userId}`);
    }
    
  } catch (error) {
    console.error('Error cleaning up user records:', error);
    // Don't throw - this is a secondary operation
  }
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can view all users');
    }

    const snapshot = await adminDb.collection(COLLECTIONS.USERS).get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName || null,
        role: data.role,
        phoneNumber: data.phoneNumber || null,
        profilePictureUrl: data.profilePictureUrl || null,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Create new user (Admin only)
 */
export async function createUser(input: unknown): Promise<{
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createUserSchema.parse(input);
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can create users');
    }

    // Create Firebase Auth user
    const createRequest: {
      email: string;
      password: string;
      displayName: string;
      phoneNumber?: string;
    } = {
      email: validated.email,
      password: validated.password,
      displayName: validated.displayName,
    };

    // Only add phone number if provided and valid
    if (validated.phoneNumber && validated.phoneNumber.startsWith('+')) {
      createRequest.phoneNumber = validated.phoneNumber;
    }

    const userRecord = await adminAuth.createUser(createRequest);

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: validated.role,
    });

    // Create Firestore user document
    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      email: validated.email,
      displayName: validated.displayName,
      role: validated.role,
      phoneNumber: validated.phoneNumber || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'User created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update user (Admin only)
 */
export async function updateUser(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateUserSchema.parse(input);
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can update users');
    }

    // Get current role before updating
    const currentUserDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.userId).get();
    if (!currentUserDoc.exists) {
      throw new Error('User not found');
    }
    const currentRole = currentUserDoc.data()?.role;

    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    // Update Firebase Auth
    const authUpdates: Record<string, unknown> = {};
    if (validated.displayName) {
      authUpdates.displayName = validated.displayName;
      updates.displayName = validated.displayName;
    }

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(validated.userId, authUpdates);
    }

    // Handle role change cascading effects
    if (validated.role && validated.role !== currentRole) {
      await handleUserRoleChange(validated.userId, currentRole, validated.role);
      
      await adminAuth.setCustomUserClaims(validated.userId, {
        role: validated.role,
      });
      updates.role = validated.role;
    }

    // Update Firestore
    if (validated.phoneNumber !== undefined) {
      updates.phoneNumber = validated.phoneNumber || null;
    }

    await adminDb.collection(COLLECTIONS.USERS).doc(validated.userId).update(updates);

    const roleChanged = validated.role && validated.role !== currentRole;
    return {
      success: true,
      message: roleChanged 
        ? 'User updated successfully. Related bookings/schedules have been cancelled.'
        : 'User updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = deleteUserSchema.parse(input);
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can delete users');
    }

    // Cannot delete yourself
    if (validated.userId === user.uid) {
      throw new Error('Cannot delete your own account');
    }

    // Get user info before deletion
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const userRole = userDoc.data()?.role;

    // Check if this is the last admin - cannot delete
    if (userRole === 'admin') {
      const adminsSnapshot = await adminDb
        .collection(COLLECTIONS.USERS)
        .where('role', '==', 'admin')
        .get();
      
      if (adminsSnapshot.size <= 1) {
        throw new Error('Cannot delete the last admin account. Create another admin first.');
      }
    }

    // Clean up all related records
    await cleanupUserRecords(validated.userId, userRole);

    // Delete from Firebase Auth
    await adminAuth.deleteUser(validated.userId);

    // Delete from Firestore
    await adminDb.collection(COLLECTIONS.USERS).doc(validated.userId).delete();

    return {
      success: true,
      message: 'User and all related records deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    return {
      success: false,
      error: message,
    };
  }
}
