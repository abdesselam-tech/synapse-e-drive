/**
 * Booking Type Definitions
 * For student lesson booking system
 */

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  scheduleId: string;
  teacherId: string;
  teacherName: string;
  lessonType: string;
  date: string; // ISO string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: 'confirmed' | 'cancelled' | 'completed';
  bookedAt: string; // ISO string
  cancelledAt?: string; // ISO string
  cancellationReason?: string;
  notes?: string;
  
  // Teacher notes
  teacherNotes?: string;
  
  // Completion tracking
  completed?: boolean;
  completedAt?: string; // ISO string
  hoursCompleted?: number; // For practical lessons
  
  // Performance tracking
  performanceRating?: 1 | 2 | 3 | 4 | 5; // Teacher rates student
  skillsImproved?: string[]; // e.g., ['Steering', 'Parking']
  areasToImprove?: string; // Teacher notes on what to focus next
  
  // Progression
  readyForNextLevel?: boolean; // Teacher assessment
}

export type CreateBookingInput = {
  scheduleId: string;
  notes?: string;
};

export type CancelBookingInput = {
  bookingId: string;
  reason?: string;
};

export type CompleteBookingInput = {
  bookingId: string;
  hoursCompleted: number;
  performanceRating: 1 | 2 | 3 | 4 | 5;
  skillsImproved: string[];
  areasToImprove: string;
  readyForNextLevel: boolean;
};

export interface StudentProgress {
  totalHours: number;
  totalLessons: number;
  averageRating: number;
  topSkills: string[];
  readyForExam: boolean;
  lastLesson: string | null;
  bookingsByType: Record<string, number>;
}
