/**
 * Profile Validation Schemas
 */

import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  emergencyContact: z.object({
    name: z.string().min(2),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    relationship: z.string().min(2),
  }).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  qualifications: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const uploadProfilePictureSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  downloadUrl: z.string().url(),
  storagePath: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UploadProfilePictureInput = z.infer<typeof uploadProfilePictureSchema>;
