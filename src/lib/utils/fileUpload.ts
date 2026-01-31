/**
 * File Upload Utilities
 * Client-side helpers for uploading files to Firebase Storage
 */

import { storage } from '@/lib/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage with progress tracking
 */
export async function uploadFileToStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  return new Promise((resolve, reject) => {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storagePath = `library/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get emoji icon for file type
 */
export function getFileIcon(fileType: string): string {
  switch (fileType) {
    case 'pdf':
      return '📄';
    case 'image':
      return '🖼️';
    case 'video':
      return '🎥';
    default:
      return '📁';
  }
}

/**
 * Get allowed file types for upload
 */
export function getAllowedFileTypes(): string {
  return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.webm,.mp3,.wav';
}

/**
 * Validate file size (max 50MB)
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}
