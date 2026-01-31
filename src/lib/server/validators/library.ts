/**
 * Library Validation Schemas
 */

import { z } from 'zod';

export const libraryCategories = [
  'road-signs',
  'traffic-rules',
  'driving-techniques',
  'exam-prep',
  'video-tutorials',
  'practice-tests',
  'other',
] as const;

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  category: z.enum(libraryCategories),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  downloadUrl: z.string().url(),
  storagePath: z.string().min(1),
});

export const deleteFileSchema = z.object({
  fileId: z.string().min(1),
});

export const updateFileSchema = z.object({
  fileId: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(libraryCategories).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
