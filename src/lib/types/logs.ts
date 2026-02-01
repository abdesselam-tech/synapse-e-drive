/**
 * Audit Log Type Definitions
 * For admin oversight and tracking all platform actions
 */

export type LogAction = 
  // User management
  | 'user_created'
  | 'user_updated'
  | 'user_deactivated'
  | 'user_reactivated'
  | 'user_language_changed'
  
  // Ranking
  | 'student_ranked_up'
  | 'student_rank_set'
  | 'student_group_transfer'
  
  // Schedules
  | 'schedule_created'
  | 'schedule_updated'
  | 'schedule_cancelled'
  | 'schedule_deleted'
  
  // Bookings
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  
  // Groups
  | 'group_created'
  | 'group_updated'
  | 'group_deleted'
  | 'group_ranks_updated'
  
  // Exam workflow
  | 'exam_form_created'
  | 'exam_form_closed'
  | 'exam_requested'
  | 'exam_approved'
  | 'exam_rejected'
  | 'exam_result_set'
  
  // Library
  | 'resource_uploaded'
  | 'resource_deleted'
  | 'resource_pinned'
  | 'resource_unpinned'
  
  // Attendance
  | 'attendance_marked'
  
  // Quizzes
  | 'quiz_created'
  | 'quiz_updated'
  | 'quiz_deleted'
  | 'quiz_attempt_completed';

export interface LogEntry {
  id: string;
  actorId: string;             // Who performed the action
  actorName: string;           // Display name
  actorRole: 'admin' | 'teacher' | 'student' | 'system';
  action: LogAction;
  targetId?: string;           // The entity that was acted upon
  targetCollection?: string;   // "users", "schedules", "examRequests", etc.
  targetName?: string;         // Human-readable name of the target
  details: Record<string, unknown>; // Additional context
  createdAt: number;
}

export interface LogFilters {
  action?: LogAction | LogAction[];
  actorId?: string;
  actorRole?: 'admin' | 'teacher' | 'student' | 'system';
  targetId?: string;
  targetCollection?: string;
  dateFrom?: number;           // Timestamp
  dateTo?: number;             // Timestamp
  searchQuery?: string;        // Search in actorName or targetName
  limit?: number;              // Max results (default 100)
  offset?: number;             // For pagination
}

export type CreateLogInput = Omit<LogEntry, 'id' | 'createdAt'>;
