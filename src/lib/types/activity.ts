/**
 * Activity Feed Type Definitions
 * For cross-role presence and group activity tracking
 */

export type ActivityType = 
  | 'booking'           // Student booked a lesson
  | 'booking_cancelled' // Booking was cancelled
  | 'rank_up'           // Student was promoted to a new rank
  | 'quiz_completed'    // Student completed a quiz
  | 'resource_added'    // Teacher added/pinned a resource
  | 'resource_removed'  // Teacher removed/unpinned a resource
  | 'exam_form_created' // Teacher created an exam form
  | 'exam_requested'    // Student requested an exam
  | 'exam_approved'     // Admin approved an exam request
  | 'exam_rejected'     // Admin rejected an exam request
  | 'exam_passed'       // Student passed an exam
  | 'exam_failed'       // Student failed an exam
  | 'student_joined'    // Student joined the group
  | 'student_left'      // Student left the group
  | 'attendance_marked' // Teacher marked attendance
  | 'schedule_created'  // New group schedule created
  | 'announcement';     // General announcement

export interface ActivityEntry {
  id: string;
  groupId: string;             // Which group this activity belongs to
  actorId: string;             // Who did the action
  actorName: string;           // Display name of the actor
  actorRole: 'admin' | 'teacher' | 'student' | 'system';
  type: ActivityType;
  title: string;               // Short title for the activity
  message: string;             // Detailed message
  metadata?: Record<string, unknown>; // Flexible payload per type
  createdAt: number;
}

export type CreateActivityInput = Omit<ActivityEntry, 'id' | 'createdAt'>;
