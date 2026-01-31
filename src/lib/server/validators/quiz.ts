/**
 * Quiz Validation Schemas
 */

import { z } from 'zod';

const multilingualString = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  ar: z.string().min(1),
});

const multilingualStringOptional = z.object({
  en: z.string().optional(),
  fr: z.string().optional(),
  ar: z.string().optional(),
});

const multilingualOptions = z.object({
  en: z.array(z.string()).length(4),
  fr: z.array(z.string()).length(4),
  ar: z.array(z.string()).length(4),
});

export const quizCategories = [
  'road-signs',
  'traffic-rules',
  'parking',
  'right-of-way',
  'speed-limits',
  'emergency-procedures',
  'vehicle-safety',
  'general-knowledge',
] as const;

export const createQuestionSchema = z.object({
  question: multilingualString,
  options: multilingualOptions,
  correctAnswer: z.number().min(0).max(3),
  explanation: multilingualStringOptional.optional(),
  category: z.enum(quizCategories),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  imageUrl: z.string().url().optional(),
});

export const createQuizSchema = z.object({
  title: multilingualString,
  description: multilingualStringOptional.optional(),
  category: z.enum(quizCategories),
  questionIds: z.array(z.string()).min(1, 'At least one question required'),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().positive().optional(),
  isPublished: z.boolean(),
});

export const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.number().min(-1).max(3)),
  timeSpent: z.number().min(0),
  language: z.enum(['en', 'fr', 'ar']),
});

export const updateQuizSchema = z.object({
  quizId: z.string().min(1),
  title: multilingualString.optional(),
  description: multilingualStringOptional.optional(),
  category: z.enum(quizCategories).optional(),
  questionIds: z.array(z.string()).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimit: z.number().positive().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const deleteQuizSchema = z.object({
  quizId: z.string().min(1),
});

export const deleteQuestionSchema = z.object({
  questionId: z.string().min(1),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
