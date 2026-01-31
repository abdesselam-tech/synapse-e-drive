/**
 * Notification Types
 * Defines data structures for the notifications system
 */

export type NotificationType = 
  // Booking related
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_teacher_notes'
  | 'booking_reminder'
  
  // Group related
  | 'group_joined'
  | 'group_removed'
  | 'group_schedule_created'
  | 'group_resource_added'
  | 'group_student_joined'
  | 'group_student_left'
  | 'group_assigned'
  
  // Exam requests
  | 'exam_request_approved'
  | 'exam_request_rejected'
  | 'exam_request_submitted'
  | 'exam_request_group_change_approved'
  | 'exam_request_group_change_rejected'
  
  // Quiz related
  | 'quiz_result_available'
  | 'quiz_published'
  
  // Library
  | 'library_file_uploaded'
  
  // System
  | 'admin_announcement'
  | 'user_registered'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    bookingId?: string;
    scheduleId?: string;
    groupId?: string;
    examRequestId?: string;
    quizId?: string;
    quizAttemptId?: string;
    fileId?: string;
    teacherId?: string;
    studentId?: string;
    passed?: boolean;
    score?: number;
    [key: string]: unknown;
  };
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
};
