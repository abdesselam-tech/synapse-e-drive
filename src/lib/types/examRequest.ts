/**
 * Exam Request Type Definitions
 */

export type ExamType = 'theory' | 'practical' | 'road-test';

export type ExamRequestStatus = 
  | 'pending'      // Submitted, awaiting review
  | 'approved'     // Approved by admin
  | 'rejected'     // Rejected by admin
  | 'scheduled'    // Exam date set
  | 'completed'    // Exam taken
  | 'cancelled';   // Cancelled by student/admin

export interface ExamRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examType: ExamType;
  status: ExamRequestStatus;
  requestedDate?: string; // ISO string - student's preferred date
  notes?: string; // Student's notes
  
  // Admin fields
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string; // ISO string
  adminNotes?: string;
  scheduledDate?: string; // ISO string - actual exam date
  rejectionReason?: string;
  
  // Completion
  completedAt?: string; // ISO string
  examResult?: 'passed' | 'failed';
  
  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type CreateExamRequestInput = {
  examType: ExamType;
  requestedDate?: string;
  notes?: string;
};

export type ReviewExamRequestInput = {
  requestId: string;
  action: 'approve' | 'reject';
  scheduledDate?: string; // Required if approving
  adminNotes?: string;
  rejectionReason?: string; // Required if rejecting
};

export type UpdateExamRequestInput = {
  requestId: string;
  status?: ExamRequestStatus;
  scheduledDate?: string;
  adminNotes?: string;
  examResult?: 'passed' | 'failed';
};
