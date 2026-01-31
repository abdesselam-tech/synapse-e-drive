/**
 * Quiz Server Actions
 * CRUD operations for quizzes and questions with multilingual support
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  createQuestionSchema,
  createQuizSchema,
  submitQuizSchema,
  updateQuizSchema,
  deleteQuizSchema,
  deleteQuestionSchema,
} from '../validators/quiz';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import type { Quiz, QuizQuestion, QuizAttempt } from '@/lib/types/quiz';
import { notifyQuizResultAvailable, notifyNewQuizPublished } from './notifications';

/**
 * Helper to convert Timestamp to ISO string
 */
function timestampToISO(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Convert Firestore quiz document to plain object
 */
function convertQuizToPlain(doc: FirebaseFirestore.DocumentSnapshot): Quiz | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    title: data.title,
    description: data.description || undefined,
    category: data.category,
    questions: data.questions || [],
    passingScore: data.passingScore,
    timeLimit: data.timeLimit || undefined,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    isPublished: data.isPublished ?? false,
    totalAttempts: data.totalAttempts || 0,
  };
}

/**
 * Convert Firestore question document to plain object
 */
function convertQuestionToPlain(doc: FirebaseFirestore.DocumentSnapshot): QuizQuestion | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    question: data.question,
    options: data.options,
    correctAnswer: data.correctAnswer,
    explanation: data.explanation || undefined,
    category: data.category,
    difficulty: data.difficulty,
    imageUrl: data.imageUrl || undefined,
  };
}

/**
 * Convert Firestore attempt document to plain object
 */
function convertAttemptToPlain(doc: FirebaseFirestore.DocumentSnapshot): QuizAttempt | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    quizId: data.quizId,
    quizTitle: data.quizTitle,
    studentId: data.studentId,
    studentName: data.studentName,
    studentEmail: data.studentEmail,
    answers: data.answers,
    score: data.score,
    passed: data.passed,
    timeSpent: data.timeSpent,
    startedAt: timestampToISO(data.startedAt),
    completedAt: timestampToISO(data.completedAt),
    language: data.language,
  };
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}

/**
 * Check if user can manage quizzes (teachers and admins)
 */
async function canManageQuizzes(userId: string): Promise<{ allowed: boolean; role?: string }> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) return { allowed: false };
  
  const role = userDoc.data()?.role;
  return { 
    allowed: role === 'admin' || role === 'teacher',
    role,
  };
}

/**
 * Create a new question
 */
export async function createQuestion(input: unknown): Promise<{
  success: boolean;
  questionId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createQuestionSchema.parse(input);
    const user = await getCurrentUser();

    const canManage = await canManageQuizzes(user.uid);
    if (!canManage.allowed) {
      throw new Error('Only teachers and admins can create questions');
    }

    const questionData = {
      ...validated,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.QUESTIONS).add(questionData);

    return {
      success: true,
      questionId: docRef.id,
      message: 'Question created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    const message = error instanceof Error ? error.message : 'Failed to create question';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all questions with optional filters
 */
export async function getQuestions(filters?: { category?: string }): Promise<QuizQuestion[]> {
  try {
    const user = await getCurrentUser();
    const canManage = await canManageQuizzes(user.uid);

    if (!canManage.allowed) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb.collection(COLLECTIONS.QUESTIONS).get();

    let questions = snapshot.docs
      .map(doc => convertQuestionToPlain(doc))
      .filter((q): q is QuizQuestion => q !== null);

    if (filters?.category) {
      questions = questions.filter(q => q.category === filters.category);
    }

    return questions;
  } catch (error) {
    console.error('Error getting questions:', error);
    throw error;
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(input: { questionId: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = deleteQuestionSchema.parse(input);
    const user = await getCurrentUser();

    const canManage = await canManageQuizzes(user.uid);
    if (!canManage.allowed) {
      throw new Error('Unauthorized');
    }

    await adminDb.collection(COLLECTIONS.QUESTIONS).doc(validated.questionId).delete();

    return {
      success: true,
      message: 'Question deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting question:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete question';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new quiz
 */
export async function createQuiz(input: unknown): Promise<{
  success: boolean;
  quizId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createQuizSchema.parse(input);
    const user = await getCurrentUser();

    const canManage = await canManageQuizzes(user.uid);
    if (!canManage.allowed) {
      throw new Error('Only teachers and admins can create quizzes');
    }

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userData = userDoc.data();

    const quizData = {
      title: validated.title,
      description: validated.description || null,
      category: validated.category,
      questions: validated.questionIds,
      passingScore: validated.passingScore,
      timeLimit: validated.timeLimit || null,
      createdBy: user.uid,
      createdByName: userData?.displayName || userData?.email || 'Unknown',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isPublished: validated.isPublished,
      totalAttempts: 0,
    };

    const docRef = await adminDb.collection(COLLECTIONS.QUIZZES).add(quizData);

    // If quiz is published, notify all students
    if (validated.isPublished) {
      try {
        const studentsSnapshot = await adminDb
          .collection(COLLECTIONS.USERS)
          .where('role', '==', 'student')
          .get();

        const studentIds = studentsSnapshot.docs.map(doc => doc.id);

        if (studentIds.length > 0) {
          const teacherName = userData?.displayName || userData?.email || 'A teacher';
          // Extract title string (prefer English, fallback to French then Arabic)
          const titleString = validated.title.en || validated.title.fr || validated.title.ar || 'New Quiz';

          await notifyNewQuizPublished(
            docRef.id,
            studentIds,
            titleString,
            teacherName
          );
        }
      } catch (notifError) {
        console.error('Error sending new quiz notification:', notifError);
      }
    }

    return {
      success: true,
      quizId: docRef.id,
      message: 'Quiz created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating quiz:', error);
    const message = error instanceof Error ? error.message : 'Failed to create quiz';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get quizzes with optional filters
 */
export async function getQuizzes(filters?: { category?: string; createdBy?: string }): Promise<Quiz[]> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    const snapshot = await adminDb.collection(COLLECTIONS.QUIZZES).get();

    let quizzes = snapshot.docs
      .map(doc => convertQuizToPlain(doc))
      .filter((q): q is Quiz => q !== null);

    // Students only see published quizzes
    if (userRole === 'student') {
      quizzes = quizzes.filter(q => q.isPublished);
    }

    if (filters?.category) {
      quizzes = quizzes.filter(q => q.category === filters.category);
    }

    if (filters?.createdBy) {
      quizzes = quizzes.filter(q => q.createdBy === filters.createdBy);
    }

    // Sort by creation date (newest first)
    return quizzes.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    throw error;
  }
}

/**
 * Get quiz by ID with questions
 */
export async function getQuizById(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> {
  try {
    const user = await getCurrentUser();
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userRole = userDoc.data()?.role;

    const quizDoc = await adminDb.collection(COLLECTIONS.QUIZZES).doc(quizId).get();
    if (!quizDoc.exists) {
      throw new Error('Quiz not found');
    }

    const quizData = quizDoc.data()!;

    // Check if student can access
    if (userRole === 'student' && !quizData.isPublished) {
      throw new Error('Quiz not available');
    }

    const quiz = convertQuizToPlain(quizDoc);
    if (!quiz) throw new Error('Invalid quiz data');

    // Fetch all questions
    const questionPromises = quiz.questions.map(qId =>
      adminDb.collection(COLLECTIONS.QUESTIONS).doc(qId).get()
    );
    const questionDocs = await Promise.all(questionPromises);
    
    const questions = questionDocs
      .map(doc => convertQuestionToPlain(doc))
      .filter((q): q is QuizQuestion => q !== null);

    return { quiz, questions };
  } catch (error) {
    console.error('Error getting quiz:', error);
    throw error;
  }
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(input: unknown): Promise<{
  success: boolean;
  attemptId?: string;
  score?: number;
  passed?: boolean;
  correctAnswers?: number;
  totalQuestions?: number;
  message?: string;
  error?: string;
}> {
  try {
    const validated = submitQuizSchema.parse(input);
    const user = await getCurrentUser();

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      throw new Error('Only students can take quizzes');
    }

    const userData = userDoc.data()!;

    // Get quiz and questions
    const { quiz, questions } = await getQuizById(validated.quizId);

    if (validated.answers.length !== questions.length) {
      throw new Error('Invalid number of answers');
    }

    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (validated.answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / questions.length) * 100;
    const passed = score >= quiz.passingScore;

    // Save attempt
    const attemptData = {
      quizId: validated.quizId,
      quizTitle: quiz.title,
      studentId: user.uid,
      studentName: userData.displayName || userData.email,
      studentEmail: userData.email,
      answers: validated.answers,
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      passed,
      timeSpent: validated.timeSpent,
      startedAt: Timestamp.fromDate(new Date(Date.now() - validated.timeSpent * 1000)),
      completedAt: Timestamp.now(),
      language: validated.language,
    };

    const attemptRef = await adminDb.collection(COLLECTIONS.QUIZ_ATTEMPTS).add(attemptData);

    // Update quiz total attempts
    await adminDb.collection(COLLECTIONS.QUIZZES).doc(validated.quizId).update({
      totalAttempts: FieldValue.increment(1),
    });

    // Send notification to student
    try {
      // Extract title string (prefer English, fallback to French then Arabic)
      const titleString = quiz.title.en || quiz.title.fr || quiz.title.ar || 'Quiz';
      
      await notifyQuizResultAvailable(
        attemptRef.id,
        user.uid,
        titleString,
        passed,
        Math.round(score * 10) / 10
      );
    } catch (notifError) {
      console.error('Error sending quiz result notification:', notifError);
    }

    return {
      success: true,
      attemptId: attemptRef.id,
      score: Math.round(score * 10) / 10,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      message: passed ? 'Congratulations! You passed!' : 'Keep practicing!',
    };
  } catch (error: unknown) {
    console.error('Error submitting quiz:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit quiz';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get student's quiz attempts
 */
export async function getStudentAttempts(studentId: string): Promise<QuizAttempt[]> {
  try {
    const user = await getCurrentUser();

    // Students can only see their own attempts
    if (user.uid !== studentId) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      const role = userDoc.data()?.role;
      if (role !== 'admin' && role !== 'teacher') {
        throw new Error('Unauthorized');
      }
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.QUIZ_ATTEMPTS)
      .where('studentId', '==', studentId)
      .get();

    const attempts = snapshot.docs
      .map(doc => convertAttemptToPlain(doc))
      .filter((a): a is QuizAttempt => a !== null);

    // Sort by completion date (most recent first)
    return attempts.sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting attempts:', error);
    throw error;
  }
}

/**
 * Get attempt details with correct answers for review
 */
export async function getAttemptDetails(attemptId: string): Promise<{
  attempt: QuizAttempt;
  quiz: Quiz;
  questions: QuizQuestion[];
}> {
  try {
    const user = await getCurrentUser();

    const attemptDoc = await adminDb.collection(COLLECTIONS.QUIZ_ATTEMPTS).doc(attemptId).get();
    if (!attemptDoc.exists) {
      throw new Error('Attempt not found');
    }

    const attemptData = attemptDoc.data()!;

    // Check access
    if (attemptData.studentId !== user.uid) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
      const role = userDoc.data()?.role;
      if (role !== 'admin' && role !== 'teacher') {
        throw new Error('Unauthorized');
      }
    }

    const attempt = convertAttemptToPlain(attemptDoc);
    if (!attempt) throw new Error('Invalid attempt data');

    // Get quiz and questions
    const { quiz, questions } = await getQuizById(attempt.quizId);

    return { attempt, quiz, questions };
  } catch (error) {
    console.error('Error getting attempt details:', error);
    throw error;
  }
}

/**
 * Update quiz
 */
export async function updateQuiz(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateQuizSchema.parse(input);
    const user = await getCurrentUser();

    const canManage = await canManageQuizzes(user.uid);
    if (!canManage.allowed) {
      throw new Error('Unauthorized');
    }

    const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (validated.title) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.category) updates.category = validated.category;
    if (validated.questionIds) updates.questions = validated.questionIds;
    if (validated.passingScore !== undefined) updates.passingScore = validated.passingScore;
    if (validated.timeLimit !== undefined) updates.timeLimit = validated.timeLimit;
    if (validated.isPublished !== undefined) updates.isPublished = validated.isPublished;

    await adminDb.collection(COLLECTIONS.QUIZZES).doc(validated.quizId).update(updates);

    return {
      success: true,
      message: 'Quiz updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating quiz:', error);
    const message = error instanceof Error ? error.message : 'Failed to update quiz';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete quiz
 */
export async function deleteQuiz(input: { quizId: string }): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = deleteQuizSchema.parse(input);
    const user = await getCurrentUser();

    const canManage = await canManageQuizzes(user.uid);
    if (!canManage.allowed) {
      throw new Error('Unauthorized');
    }

    await adminDb.collection(COLLECTIONS.QUIZZES).doc(validated.quizId).delete();

    return {
      success: true,
      message: 'Quiz deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting quiz:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete quiz';
    return {
      success: false,
      error: message,
    };
  }
}
