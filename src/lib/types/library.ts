/**
 * Library Type Definitions
 * For file management and learning materials
 */

export type LibraryCategory = 
  | 'road-signs'
  | 'traffic-rules'
  | 'driving-techniques'
  | 'exam-prep'
  | 'video-tutorials'
  | 'practice-tests'
  | 'other';

export interface LibraryFile {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string; // 'pdf', 'image', 'video', 'document'
  mimeType: string;
  fileSize: number; // in bytes
  category: LibraryCategory;
  description?: string;
  downloadUrl: string;
  storagePath: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: 'admin' | 'teacher';
  uploadedAt: string; // ISO string
  downloads: number;
  tags?: string[];
  isPublic: boolean; // true = all students can see, false = restricted
  
  // Group pinning - resources can be pinned to specific groups
  groupIds?: string[];         // Groups this resource is pinned to (set by teacher)
}

export type UploadLibraryFileInput = {
  file: File;
  category: LibraryCategory;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
};
