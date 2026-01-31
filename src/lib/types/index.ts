/**
 * Type definitions for Synapse E-Drive
 */

// Re-export Algeria-specific types
export * from './algeria';

// Re-export schedule types
export * from './schedule';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  
  // Algeria-specific fields
  nationalIdNumber?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  dateOfBirth?: Date;
  wilaya?: string;
  daira?: string;
  preferredLanguage?: 'ar' | 'fr' | 'en';
  
  // For students
  targetLicenseCategory?: string;
  currentLicenseCategories?: string[];
  theoreticalHoursCompleted?: number;
  practicalHoursCompleted?: number;
  theoryExamPassed?: boolean;
  theoryExamDate?: Date;
  practicalExamPassed?: boolean;
  practicalExamDate?: Date;
  currentPoints?: number;
  isProbationary?: boolean;
  probationaryEndDate?: Date;
  medicalCertificateDate?: Date;
  medicalCertificateExpiry?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Schedule types are now in ./schedule.ts
export type { Schedule, ScheduleFormData, LessonType, ScheduleStatus } from './schedule';

export interface Passcode {
  id: string;
  code: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
  category?: string;
}

export interface Quiz {
  id: string;
  title: string;
  titleAr?: string;
  titleFr?: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  teacherId: string;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  
  // Algeria-specific
  topic?: string; // e.g., 'traffic-rules', 'road-signs', 'point-system'
  targetCategory?: string; // License category (A, B, C, D, etc.)
  isOfficialExam?: boolean;
  passingPercentage?: number; // Default 83% for Algeria
  timeLimit?: number; // In minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionAr?: string;
  questionFr?: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: QuizOption[];
  correctAnswer: string | string[];
  explanation?: string;
  explanationAr?: string;
  explanationFr?: string;
  points: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  lawReference?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  textAr?: string;
  textFr?: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string | string[]>;
  score: number;
  totalPoints: number;
  submittedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}

export interface ExamRequest {
  id: string;
  studentId: string;
  teacherId: string;
  requestedDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
