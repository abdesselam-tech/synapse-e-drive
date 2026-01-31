/**
 * Booking Validation Schemas
 */

import { z } from 'zod';

export const createBookingSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  notes: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
