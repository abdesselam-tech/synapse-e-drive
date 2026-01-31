/**
 * Group Validators
 * Zod schemas for group-related operations
 */

import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  teacherId: z.string().min(1, 'Teacher is required'),
  maxStudents: z.number().min(1).max(50),
  schedule: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateGroupSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  teacherId: z.string().min(1).optional(),
  maxStudents: z.number().min(1).max(50).optional(),
  schedule: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

export const joinGroupSchema = z.object({
  groupId: z.string().min(1),
});

export const createGroupScheduleSchema = z.object({
  groupId: z.string().min(1),
  lessonType: z.string().min(1),
  topic: z.string().min(3).max(200),
  date: z.string().min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  location: z.string().optional(),
  notes: z.string().max(500).optional(),
  attendanceRequired: z.boolean().default(false),
});

export const createGroupResourceSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['library-reference', 'quiz-reference', 'external-link', 'uploaded-file']),
  
  // Library reference fields
  libraryFileId: z.string().optional(),
  
  // Quiz reference fields
  quizId: z.string().optional(),
  
  // External link fields
  externalUrl: z.string().url().optional(),
  
  // Uploaded file fields
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
}).refine(
  (data) => {
    if (data.type === 'library-reference') return !!data.libraryFileId;
    if (data.type === 'quiz-reference') return !!data.quizId;
    if (data.type === 'external-link') return !!data.externalUrl;
    if (data.type === 'uploaded-file') return !!data.fileUrl && !!data.fileName;
    return false;
  },
  {
    message: "Invalid resource data for the selected type",
  }
);
