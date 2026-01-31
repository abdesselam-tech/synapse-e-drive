/**
 * Exam Request Validation Schemas
 */

import { z } from 'zod';

export const examTypes = ['theory', 'practical', 'road-test'] as const;
export const examStatuses = ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'] as const;

export const createExamRequestSchema = z.object({
  examType: z.enum(examTypes),
  requestedDate: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const reviewExamRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  scheduledDate: z.string().optional(),
  adminNotes: z.string().max(500).optional(),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'approve' && !data.scheduledDate) {
      return false;
    }
    if (data.action === 'reject' && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: "Scheduled date required for approval, rejection reason required for rejection",
  }
);

export const updateExamRequestSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(examStatuses).optional(),
  scheduledDate: z.string().optional(),
  adminNotes: z.string().max(500).optional(),
  examResult: z.enum(['passed', 'failed']).optional(),
});

export const cancelExamRequestSchema = z.object({
  requestId: z.string().min(1),
});

export type CreateExamRequestInput = z.infer<typeof createExamRequestSchema>;
export type ReviewExamRequestInput = z.infer<typeof reviewExamRequestSchema>;
export type UpdateExamRequestInput = z.infer<typeof updateExamRequestSchema>;
