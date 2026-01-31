/**
 * Schedule Type Definitions
 * For teacher lesson scheduling system
 */

export type LessonType = 'theoretical' | 'practical' | 'exam_prep';
export type ScheduleStatus = 'available' | 'booked' | 'completed' | 'cancelled';

export type FirestoreTimestamp = {
  toDate: () => Date;
};

export type TimestampLike = FirestoreTimestamp | Date | string;

/**
 * Schedule interface matching Firestore structure
 */
export interface Schedule {
  id: string;
  teacherId: string;
  teacherName: string;
  date: TimestampLike; // Firestore Timestamp or serialized value
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  lessonType: LessonType;
  maxStudents: number; // 1 for practical, 10 for theoretical
  bookedStudents: string[]; // Array of student IDs
  status: ScheduleStatus;
  location?: string; // Optional: where the lesson takes place
  notes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

/**
 * Schedule form data (for creating/updating schedules)
 * Uses Date instead of Timestamp for easier form handling
 */
export interface ScheduleFormData {
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  lessonType: LessonType;
  maxStudents: number;
  location?: string;
  notes?: string;
}
