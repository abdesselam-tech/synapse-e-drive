/**
 * Exam Request Type Definitions
 * New workflow: Teacher creates ExamForm → Student requests → Admin decides
 */

export type ExamType = 'theory' | 'practical' | 'road-test';

export type ExamRequestStatus = 
  | 'pending'      // Submitted, awaiting admin review
  | 'approved'     // Approved by admin
  | 'rejected'     // Rejected by admin
  | 'passed'       // Exam taken and passed
  | 'failed';      // Exam taken and failed

/**
 * Exam Form - Created by teacher to open an exam slot for students
 * Stored in: groups/{groupId}/examForms/{formId}
 */
export interface ExamForm {
  id: string;
  teacherId: string;
  teacherName: string;
  examDate: string;            // Pre-filled by teacher (ISO date)
  examTime: string;            // Pre-filled by teacher (HH:MM)
  title: string;               // e.g. "Exam Session — Mars 2026"
  examType: ExamType;
  isOpen: boolean;             // Students can only request when true
  maxRequests: number;         // How many students can request for this slot
  currentRequests: number;     // Running count
  createdAt: number;
  updatedAt: number;
}

/**
 * Exam Request - Created by student when requesting an exam
 */
export interface ExamRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  groupId: string;
  teacherId: string;           // Teacher who created the exam form window
  teacherName: string;
  formId: string;              // References the examForms sub-record in the group
  examType: ExamType;
  status: ExamRequestStatus;
  examDate: string;            // ISO date set by the teacher when uploading the form
  examTime: string;            // Time slot set by the teacher
  
  // Student notes
  studentNotes?: string;
  
  // Admin decision
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  
  // Result (set after exam is graded)
  result?: 'passed' | 'failed';
  resultNotes?: string;
  resultSetBy?: string;
  resultSetAt?: string;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export type CreateExamFormInput = {
  title: string;
  examType: ExamType;
  examDate: string;
  examTime: string;
  maxRequests: number;
};

export type CreateExamRequestInput = {
  formId: string;
  groupId: string;
  studentNotes?: string;
};

export type ReviewExamRequestInput = {
  requestId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
  rejectionReason?: string; // Required if rejecting
};

export type SetExamResultInput = {
  requestId: string;
  result: 'passed' | 'failed';
  resultNotes?: string;
};
