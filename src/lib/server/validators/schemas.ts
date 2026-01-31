/**
 * Zod Validation Schemas
 * All data validation schemas for Firestore collections
 * Includes Algeria-specific validations
 */

import { z } from 'zod';

// ============================================================================
// ALGERIA-SPECIFIC SCHEMAS
// ============================================================================

// License Categories (Algeria)
export const licenseCategorySchema = z.enum([
  'A1', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'
]);

// Blood Types
export const bloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

// Exam Languages (Algeria)
export const examLanguageSchema = z.enum(['ar', 'fr', 'en']);

// Contravention Degrees (Algeria)
export const contraventionDegreeSchema = z.enum(['1', '2', '3', '4', 'delictual']);

// Quiz Topics (Algeria Code de la Route)
export const quizTopicSchema = z.enum([
  'traffic-rules',
  'road-signs',
  'vehicle-operation',
  'speed-limits',
  'alcohol-impairment',
  'safety-equipment',
  'priority-rules',
  'point-system',
  'vehicle-categories',
]);

// Difficulty Levels
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

// ============================================================================
// USER SCHEMAS
// ============================================================================

// User Role
export const userRoleSchema = z.enum(['admin', 'teacher', 'student']);

// User Schema (with Algeria-specific fields)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  displayName: z.string().optional(),
  phoneNumber: z.string().optional(),
  photoURL: z.string().url().optional(),
  
  // Algeria-specific fields
  nationalIdNumber: z.string().optional(),
  bloodType: bloodTypeSchema.optional(),
  dateOfBirth: z.date().optional(),
  wilaya: z.string().optional(),
  daira: z.string().optional(),
  preferredLanguage: examLanguageSchema.optional(),
  
  // Student-specific fields
  targetLicenseCategory: licenseCategorySchema.optional(),
  currentLicenseCategories: z.array(licenseCategorySchema).optional(),
  theoreticalHoursCompleted: z.number().min(0).max(25).optional(),
  practicalHoursCompleted: z.number().min(0).max(30).optional(),
  theoryExamPassed: z.boolean().optional(),
  theoryExamDate: z.date().optional(),
  practicalExamPassed: z.boolean().optional(),
  practicalExamDate: z.date().optional(),
  currentPoints: z.number().min(0).max(24).optional(),
  isProbationary: z.boolean().optional(),
  probationaryEndDate: z.date().optional(),
  medicalCertificateDate: z.date().optional(),
  medicalCertificateExpiry: z.date().optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// SCHEDULE SCHEMAS
// ============================================================================

// Schedule Status
export const scheduleStatusSchema = z.enum(['available', 'booked', 'cancelled', 'completed']);

// Lesson Type (Algeria training)
export const lessonTypeSchema = z.enum(['theoretical', 'practical', 'exam_prep']);

// Time format validation (HH:mm)
const timeStringSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Time must be in HH:mm format (e.g., 09:00)',
});

// Schedule Schema (matching Firestore structure)
export const scheduleSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  date: z.any(), // Firestore Timestamp (validated separately)
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  lessonType: lessonTypeSchema,
  maxStudents: z.number().min(1).max(10),
  bookedStudents: z.array(z.string()),
  status: scheduleStatusSchema,
  location: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any(), // Firestore Timestamp
});

// ============================================================================
// PASSCODE SCHEMAS
// ============================================================================

// Passcode Schema
export const passcodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  used: z.boolean(),
  createdAt: z.date(),
});

// ============================================================================
// GROUP SCHEMAS
// ============================================================================

// Group Schema
export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  teacherId: z.string(),
  studentIds: z.array(z.string()),
  targetCategory: licenseCategorySchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// LIBRARY SCHEMAS
// ============================================================================

// Library Item Schema
export const libraryItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  titleFr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionFr: z.string().optional(),
  fileUrl: z.string().url(),
  uploadedBy: z.string(),
  uploadedAt: z.date(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  targetCategory: licenseCategorySchema.optional(),
  topic: quizTopicSchema.optional(),
});

// ============================================================================
// QUIZ SCHEMAS
// ============================================================================

// Quiz Question Type
export const quizQuestionTypeSchema = z.enum(['multiple-choice', 'true-false', 'short-answer']);

// Quiz Option Schema (multilingual)
export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  textAr: z.string().optional(),
  textFr: z.string().optional(),
});

// Quiz Question Schema (multilingual with Algeria specifics)
export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  questionAr: z.string().optional(),
  questionFr: z.string().optional(),
  type: quizQuestionTypeSchema,
  options: z.array(quizOptionSchema).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  explanationAr: z.string().optional(),
  explanationFr: z.string().optional(),
  points: z.number().min(0),
  topic: quizTopicSchema.optional(),
  difficulty: difficultySchema.optional(),
  lawReference: z.string().optional(),
});

// Quiz Schema (with Algeria-specific fields)
export const quizSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  titleFr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionFr: z.string().optional(),
  teacherId: z.string(),
  questions: z.array(quizQuestionSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  dueDate: z.date().optional(),
  
  // Algeria-specific
  topic: quizTopicSchema.optional(),
  targetCategory: licenseCategorySchema.optional(),
  isOfficialExam: z.boolean().optional(),
  passingPercentage: z.number().min(0).max(100).default(83), // Algeria standard
  timeLimit: z.number().min(1).optional(), // In minutes
});

// Quiz Result Schema
export const quizResultSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  studentId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  score: z.number().min(0),
  totalPoints: z.number().min(0),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedAt: z.date(),
  timeSpent: z.number().optional(), // In seconds
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

// Notification Type
export const notificationTypeSchema = z.enum(['info', 'warning', 'error', 'success']);

// Notification Schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  titleFr: z.string().optional(),
  message: z.string().min(1),
  messageAr: z.string().optional(),
  messageFr: z.string().optional(),
  type: notificationTypeSchema,
  read: z.boolean(),
  createdAt: z.date(),
});

// ============================================================================
// EXAM REQUEST SCHEMAS
// ============================================================================

// Exam Request Status
export const examRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);

// Exam Type (Algeria)
export const examTypeSchema = z.enum(['theory', 'practical']);

// Exam Request Schema
export const examRequestSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  teacherId: z.string(),
  requestedDate: z.date(),
  examType: examTypeSchema,
  targetCategory: licenseCategorySchema,
  status: examRequestStatusSchema,
  reason: z.string().optional(),
  adminNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// TRAINING PROGRESS SCHEMA (Algeria-specific)
// ============================================================================

export const trainingProgressSchema = z.object({
  studentId: z.string(),
  targetCategory: licenseCategorySchema,
  
  // Hours tracking (Algeria: 25 theory + 30 practical = 55 total)
  theoreticalHoursCompleted: z.number().min(0).max(25).default(0),
  practicalHoursCompleted: z.number().min(0).max(30).default(0),
  
  // Exam status
  theoryExamAttempts: z.number().min(0).default(0),
  theoryExamPassed: z.boolean().default(false),
  theoryExamDate: z.date().optional(),
  practicalExamAttempts: z.number().min(0).default(0),
  practicalExamPassed: z.boolean().default(false),
  practicalExamDate: z.date().optional(),
  
  // Medical
  medicalCertificateValid: z.boolean().default(false),
  medicalCertificateExpiry: z.date().optional(),
  
  // License
  licenseIssued: z.boolean().default(false),
  licenseIssueDate: z.date().optional(),
  isProbationary: z.boolean().default(true),
  probationaryEndDate: z.date().optional(),
  currentPoints: z.number().min(0).max(24).default(12), // Start with 12 for probationary
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// INPUT SCHEMAS (for creating/updating)
// ============================================================================

export const createUserInputSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserInputSchema = userSchema.partial().omit({ id: true, createdAt: true });

// Base schedule fields schema (without refinements)
const scheduleFieldsSchema = z.object({
  date: z.date(),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  lessonType: lessonTypeSchema,
  maxStudents: z.number().min(1).max(10),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Schedule Create Schema (for forms) - with refinements
export const scheduleCreateSchema = scheduleFieldsSchema
  .refine(
    (data) => data.date >= new Date(new Date().setHours(0, 0, 0, 0)),
    {
      message: 'Date must be in the future',
      path: ['date'],
    }
  )
  .refine(
    (data) => {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      // Practical lessons must have maxStudents = 1
      if (data.lessonType === 'practical' && data.maxStudents !== 1) {
        return false;
      }
      // Theoretical lessons can have up to 10 students
      if (data.lessonType === 'theoretical' && data.maxStudents > 10) {
        return false;
      }
      return true;
    },
    {
      message: 'Practical lessons must have maxStudents = 1, theoretical can have up to 10',
      path: ['maxStudents'],
    }
  );

// Schedule Update Schema - use base fields schema partial (no refinements on update)
export const scheduleUpdateSchema = scheduleFieldsSchema.partial();

// Legacy schemas (for backward compatibility)
export const createScheduleInputSchema = scheduleCreateSchema;
export const updateScheduleInputSchema = scheduleUpdateSchema;

export const createQuizInputSchema = quizSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateQuizInputSchema = quizSchema.partial().omit({ id: true, createdAt: true });

export const createQuizResultInputSchema = quizResultSchema.omit({ id: true, submittedAt: true });

export const createNotificationInputSchema = notificationSchema.omit({ id: true, read: true, createdAt: true });

export const createExamRequestInputSchema = examRequestSchema.omit({ id: true, status: true, createdAt: true, updatedAt: true });
export const updateExamRequestInputSchema = examRequestSchema.partial().omit({ id: true, createdAt: true });

export const createLibraryItemInputSchema = libraryItemSchema.omit({ id: true, uploadedAt: true });
export const updateLibraryItemInputSchema = libraryItemSchema.partial().omit({ id: true, uploadedAt: true, uploadedBy: true });

export const createGroupInputSchema = groupSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateGroupInputSchema = groupSchema.partial().omit({ id: true, createdAt: true });

export const createTrainingProgressInputSchema = trainingProgressSchema.omit({ createdAt: true, updatedAt: true });
export const updateTrainingProgressInputSchema = trainingProgressSchema.partial().omit({ studentId: true, createdAt: true });

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UserRole = z.infer<typeof userRoleSchema>;
export type LicenseCategory = z.infer<typeof licenseCategorySchema>;
export type BloodType = z.infer<typeof bloodTypeSchema>;
export type ExamLanguage = z.infer<typeof examLanguageSchema>;
export type QuizTopic = z.infer<typeof quizTopicSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type ScheduleStatus = z.infer<typeof scheduleStatusSchema>;
export type LessonType = z.infer<typeof lessonTypeSchema>;
export type QuizQuestionType = z.infer<typeof quizQuestionTypeSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type ExamRequestStatus = z.infer<typeof examRequestStatusSchema>;
export type ExamType = z.infer<typeof examTypeSchema>;
