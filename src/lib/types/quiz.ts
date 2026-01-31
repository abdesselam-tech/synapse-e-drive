/**
 * Quiz Type Definitions
 * For quiz system with multilingual support (Arabic, French, English)
 */

export type QuizLanguage = 'en' | 'fr' | 'ar';

export type QuizCategory = 
  | 'road-signs'
  | 'traffic-rules'
  | 'parking'
  | 'right-of-way'
  | 'speed-limits'
  | 'emergency-procedures'
  | 'vehicle-safety'
  | 'general-knowledge';

export interface MultilingualString {
  en: string;
  fr: string;
  ar: string;
}

export interface MultilingualStringOptional {
  en?: string;
  fr?: string;
  ar?: string;
}

export interface MultilingualOptions {
  en: string[];
  fr: string[];
  ar: string[];
}

export interface QuizQuestion {
  id: string;
  question: MultilingualString;
  options: MultilingualOptions;
  correctAnswer: number; // Index of correct option (0-3)
  explanation?: MultilingualStringOptional;
  category: QuizCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string; // Optional image (for road signs, etc.)
}

export interface Quiz {
  id: string;
  title: MultilingualString;
  description?: MultilingualStringOptional;
  category: QuizCategory;
  questions: string[]; // Array of question IDs
  passingScore: number; // Percentage (e.g., 70 for 70%)
  timeLimit?: number; // In minutes, optional
  createdBy: string;
  createdByName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPublished: boolean;
  totalAttempts: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: MultilingualString;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: number[]; // Array of selected answer indices
  score: number; // Percentage
  passed: boolean;
  timeSpent: number; // In seconds
  startedAt: string; // ISO string
  completedAt: string; // ISO string
  language: QuizLanguage;
}

export type CreateQuizInput = {
  title: MultilingualString;
  description?: MultilingualStringOptional;
  category: QuizCategory;
  questionIds: string[];
  passingScore: number;
  timeLimit?: number;
  isPublished: boolean;
};

export type CreateQuestionInput = {
  question: MultilingualString;
  options: MultilingualOptions;
  correctAnswer: number;
  explanation?: MultilingualStringOptional;
  category: QuizCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
};

export type SubmitQuizInput = {
  quizId: string;
  answers: number[];
  timeSpent: number;
  language: QuizLanguage;
};
