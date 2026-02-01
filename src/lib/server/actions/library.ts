/**
 * Library Server Actions
 * CRUD operations for learning materials with role-based permissions
 */

'use server';

import { adminDb, adminAuth, adminStorage } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { uploadFileSchema, deleteFileSchema, updateFileSchema } from '../validators/library';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { LibraryFile, LibraryCategory } from '@/lib/types/library';
import { notifyLibraryFileUploaded } from './notifications';

/**
 * Helper to convert Timestamp to ISO string
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
 * Convert Firestore file document to plain object for client
 */
function convertFileToPlain(doc: FirebaseFirestore.DocumentSnapshot): LibraryFile | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    fileName: data.fileName,
    originalName: data.originalName,
    fileType: data.fileType,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    category: data.category as LibraryCategory,
    description: data.description || undefined,
    downloadUrl: data.downloadUrl,
    storagePath: data.storagePath,
    uploadedBy: data.uploadedBy,
    uploadedByName: data.uploadedByName,
    uploadedByRole: data.uploadedByRole,
    uploadedAt: timestampToISO(data.uploadedAt),
    downloads: data.downloads || 0,
    tags: data.tags || [],
    isPublic: data.isPublic ?? true,
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
 * Check if user can upload files
 */
async function canUpload(userId: string): Promise<{ allowed: boolean; role?: string }> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) return { allowed: false };
  
  const role = userDoc.data()?.role;
  return { 
    allowed: role === 'admin' || role === 'teacher',
    role,
  };
}

/**
 * Get library files with optional filters
 */
export async function getLibraryFiles(filters?: {
  category?: string;
  search?: string;
  uploadedBy?: string;
}): Promise<LibraryFile[]> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    // Get all library files
    const snapshot = await adminDb.collection(COLLECTIONS.LIBRARY).get();

    let files = snapshot.docs
      .map(doc => convertFileToPlain(doc))
      .filter((f): f is LibraryFile => f !== null);

    // Students only see public files
    if (userRole === 'student') {
      files = files.filter(f => f.isPublic);
    }

    // Apply category filter
    if (filters?.category) {
      files = files.filter(f => f.category === filters.category);
    }

    // Apply uploader filter
    if (filters?.uploadedBy) {
      files = files.filter(f => f.uploadedBy === filters.uploadedBy);
    }

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      files = files.filter(f => 
        f.originalName.toLowerCase().includes(searchLower) ||
        f.description?.toLowerCase().includes(searchLower) ||
        f.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by upload date (newest first)
    return files.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting library files:', error);
    throw error;
  }
}

/**
 * Save file metadata after upload to Firebase Storage
 */
export async function saveFileMetadata(input: {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  downloadUrl: string;
  storagePath: string;
}): Promise<{
  success: boolean;
  fileId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = uploadFileSchema.parse(input);
    const user = await getCurrentUser();

    // Check permissions
    const uploadCheck = await canUpload(user.uid);
    if (!uploadCheck.allowed) {
      throw new Error('Only admins and teachers can upload files');
    }

    // Get user details
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userData = userDoc.data();

    // Determine file type from MIME type
    let fileType = 'document';
    if (validated.mimeType.startsWith('image/')) fileType = 'image';
    else if (validated.mimeType.startsWith('video/')) fileType = 'video';
    else if (validated.mimeType === 'application/pdf') fileType = 'pdf';

    // Save to Firestore
    const fileData = {
      fileName: validated.fileName,
      originalName: validated.originalName,
      fileType,
      mimeType: validated.mimeType,
      fileSize: validated.fileSize,
      category: validated.category,
      description: validated.description || null,
      downloadUrl: validated.downloadUrl,
      storagePath: validated.storagePath,
      uploadedBy: user.uid,
      uploadedByName: userData?.displayName || userData?.email || 'Unknown',
      uploadedByRole: uploadCheck.role,
      uploadedAt: Timestamp.now(),
      downloads: 0,
      tags: validated.tags || [],
      isPublic: validated.isPublic ?? true,
    };

    const docRef = await adminDb.collection(COLLECTIONS.LIBRARY).add(fileData);

    // Notify all students about new library file (only for public files)
    if (validated.isPublic !== false) {
      try {
        const studentsSnapshot = await adminDb
          .collection(COLLECTIONS.USERS)
          .where('role', '==', 'student')
          .get();

        const studentIds = studentsSnapshot.docs.map(doc => doc.id);

        if (studentIds.length > 0) {
          await notifyLibraryFileUploaded(
            docRef.id,
            studentIds,
            validated.originalName || validated.fileName || 'New file',
            validated.category || 'Library'
          );
        }
      } catch (notifError) {
        console.error('Error sending library file notification:', notifError);
      }
    }

    return {
      success: true,
      fileId: docRef.id,
      message: 'File uploaded successfully',
    };
  } catch (error: unknown) {
    console.error('Error saving file metadata:', error);
    const message = error instanceof Error ? error.message : 'Failed to save file';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete a library file
 */
export async function deleteLibraryFile(input: { fileId: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = deleteFileSchema.parse(input);
    const user = await getCurrentUser();

    // Get file document
    const fileDoc = await adminDb.collection(COLLECTIONS.LIBRARY).doc(validated.fileId).get();
    if (!fileDoc.exists) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data()!;

    // Check permissions (only uploader or admin can delete)
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (fileData.uploadedBy !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized to delete this file');
    }

    // Delete from Storage
    try {
      const bucket = adminStorage.bucket();
      await bucket.file(fileData.storagePath).delete();
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue even if storage deletion fails
    }

    // Delete from Firestore
    await adminDb.collection(COLLECTIONS.LIBRARY).doc(validated.fileId).delete();

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update file metadata
 */
export async function updateLibraryFile(input: {
  fileId: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateFileSchema.parse(input);
    const user = await getCurrentUser();

    // Get file document
    const fileDoc = await adminDb.collection(COLLECTIONS.LIBRARY).doc(validated.fileId).get();
    if (!fileDoc.exists) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data()!;

    // Check permissions
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (fileData.uploadedBy !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized to edit this file');
    }

    // Update document
    const updates: Record<string, unknown> = {};
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.category !== undefined) updates.category = validated.category;
    if (validated.tags !== undefined) updates.tags = validated.tags;
    if (validated.isPublic !== undefined) updates.isPublic = validated.isPublic;

    await adminDb.collection(COLLECTIONS.LIBRARY).doc(validated.fileId).update(updates);

    return {
      success: true,
      message: 'File updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating file:', error);
    const message = error instanceof Error ? error.message : 'Failed to update file';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Increment download count for a file
 */
export async function incrementDownloadCount(fileId: string): Promise<{ success: boolean }> {
  try {
    await adminDb.collection(COLLECTIONS.LIBRARY).doc(fileId).update({
      downloads: FieldValue.increment(1),
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing download count:', error);
    return { success: false };
  }
}

// ============================================================================
// LIBRARY PINNING (Group-specific resources)
// ============================================================================

/**
 * Pin a resource to a group (Teacher/Admin only)
 */
export async function pinResourceToGroup(
  libraryId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (userRole !== 'admin' && userRole !== 'teacher') {
      return { success: false, error: 'Permission denied' };
    }

    // Verify group exists and teacher owns it (if teacher)
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }

    if (userRole === 'teacher' && groupDoc.data()?.teacherId !== user.uid) {
      return { success: false, error: 'You can only pin resources to your own groups' };
    }

    // Verify library resource exists
    const libraryDoc = await adminDb.collection(COLLECTIONS.LIBRARY).doc(libraryId).get();
    if (!libraryDoc.exists) {
      return { success: false, error: 'Resource not found' };
    }

    // Add groupId to the resource's groupIds array
    await libraryDoc.ref.update({
      groupIds: FieldValue.arrayUnion(groupId),
    });

    // Also add to group's resources array
    await groupDoc.ref.update({
      resources: FieldValue.arrayUnion(libraryId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error pinning resource to group:', error);
    return { success: false, error: 'Failed to pin resource' };
  }
}

/**
 * Unpin a resource from a group (Teacher/Admin only)
 */
export async function unpinResourceFromGroup(
  libraryId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    if (userRole !== 'admin' && userRole !== 'teacher') {
      return { success: false, error: 'Permission denied' };
    }

    // Verify group exists and teacher owns it (if teacher)
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }

    if (userRole === 'teacher' && groupDoc.data()?.teacherId !== user.uid) {
      return { success: false, error: 'You can only unpin resources from your own groups' };
    }

    // Remove groupId from the resource's groupIds array
    const libraryDoc = await adminDb.collection(COLLECTIONS.LIBRARY).doc(libraryId).get();
    if (libraryDoc.exists) {
      await libraryDoc.ref.update({
        groupIds: FieldValue.arrayRemove(groupId),
      });
    }

    // Also remove from group's resources array
    await groupDoc.ref.update({
      resources: FieldValue.arrayRemove(libraryId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error unpinning resource from group:', error);
    return { success: false, error: 'Failed to unpin resource' };
  }
}

/**
 * Extended library file with pinning info
 */
export interface LibraryFileWithPinning extends LibraryFile {
  isPinned: boolean;
  pinnedGroupNames?: string[];
}

/**
 * Get library files for a user with pinning information
 */
export async function getLibraryForUser(userId: string): Promise<LibraryFileWithPinning[]> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      return [];
    }

    const userData = userDoc.data()!;
    const userRole = userData.role;
    const userGroupId = userData.groupId;

    // Get all library files
    const snapshot = await adminDb.collection(COLLECTIONS.LIBRARY).get();
    
    // Get user's groups (for teachers, get all their groups)
    let userGroupIds: string[] = [];
    if (userRole === 'student' && userGroupId) {
      userGroupIds = [userGroupId];
    } else if (userRole === 'teacher') {
      const groupsSnapshot = await adminDb
        .collection(COLLECTIONS.GROUPS)
        .where('teacherId', '==', userId)
        .get();
      userGroupIds = groupsSnapshot.docs.map(doc => doc.id);
    } else if (userRole === 'admin') {
      // Admin sees all groups
      const groupsSnapshot = await adminDb.collection(COLLECTIONS.GROUPS).get();
      userGroupIds = groupsSnapshot.docs.map(doc => doc.id);
    }

    // Get group names for pinned resources
    const groupNamesMap: Record<string, string> = {};
    if (userGroupIds.length > 0) {
      const groupsSnapshot = await adminDb
        .collection(COLLECTIONS.GROUPS)
        .where('__name__', 'in', userGroupIds.slice(0, 10)) // Firestore limit
        .get();
      groupsSnapshot.docs.forEach(doc => {
        groupNamesMap[doc.id] = doc.data().name;
      });
    }

    const files: LibraryFileWithPinning[] = [];
    
    for (const doc of snapshot.docs) {
      const plainFile = convertFileToPlain(doc);
      if (!plainFile) continue;

      const data = doc.data();
      const fileGroupIds: string[] = data?.groupIds || [];
      
      // Check if pinned to any of user's groups
      const isPinned = fileGroupIds.some(gid => userGroupIds.includes(gid));
      const pinnedGroupNames = fileGroupIds
        .filter(gid => userGroupIds.includes(gid))
        .map(gid => groupNamesMap[gid])
        .filter(Boolean);

      files.push({
        ...plainFile,
        groupIds: fileGroupIds,
        isPinned,
        pinnedGroupNames: pinnedGroupNames.length > 0 ? pinnedGroupNames : undefined,
      });
    }

    // Sort: pinned first, then by upload date
    files.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    return files;
  } catch (error) {
    console.error('Error getting library for user:', error);
    return [];
  }
}

/**
 * Get pinned resources for a specific group
 */
export async function getPinnedResourcesForGroup(groupId: string): Promise<LibraryFile[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.LIBRARY)
      .where('groupIds', 'array-contains', groupId)
      .get();

    return snapshot.docs
      .map(doc => convertFileToPlain(doc))
      .filter((f): f is LibraryFile => f !== null);
  } catch (error) {
    console.error('Error getting pinned resources for group:', error);
    return [];
  }
}
