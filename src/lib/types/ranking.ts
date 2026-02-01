/**
 * Ranking System Type Definitions
 * For student progression within groups
 */

import type { RankDefinition } from './group';

/**
 * Student's current rank information
 */
export interface RankInfo {
  studentId: string;
  studentName: string;
  groupId: string | null;
  groupName: string | null;
  currentRank: number;         // Current rank level (1-based)
  currentRankLabel: string;    // Label for current rank
  maxRank: number;             // Maximum rank in the group
  unlockedFeatures: string[];  // Features unlocked at current rank
  nextRankLabel?: string;      // Label for next rank (if not at max)
  progressToNextRank?: number; // 0-100 percentage (optional, for UI)
}

/**
 * Feature keys that can be unlocked by ranks
 */
export type UnlockableFeature = 
  | 'book_code'           // Can book code/theory sessions
  | 'book_creneau'        // Can book créneau sessions
  | 'book_conduite'       // Can book conduite sessions
  | 'quiz_basic'          // Access to basic quizzes
  | 'quiz_advanced'       // Access to advanced quizzes
  | 'quiz_exam_prep'      // Access to exam preparation quizzes
  | 'request_theory_exam' // Can request theory exam
  | 'request_practical_exam'; // Can request practical exam

/**
 * Default rank definitions for new groups
 */
export const DEFAULT_RANKS: RankDefinition[] = [
  {
    level: 1,
    label: 'Code',
    labelFr: 'Code',
    labelAr: 'الكود',
    unlockedFeatures: ['book_code', 'quiz_basic'],
  },
  {
    level: 2,
    label: 'Créneau',
    labelFr: 'Créneau',
    labelAr: 'كرينو',
    unlockedFeatures: ['book_code', 'book_creneau', 'quiz_basic', 'quiz_advanced', 'request_theory_exam'],
  },
  {
    level: 3,
    label: 'Conduite',
    labelFr: 'Conduite',
    labelAr: 'القيادة',
    unlockedFeatures: ['book_code', 'book_creneau', 'book_conduite', 'quiz_basic', 'quiz_advanced', 'quiz_exam_prep'],
  },
  {
    level: 4,
    label: 'Préparation Examen',
    labelFr: 'Préparation Examen',
    labelAr: 'التحضير للامتحان',
    unlockedFeatures: ['book_code', 'book_creneau', 'book_conduite', 'quiz_basic', 'quiz_advanced', 'quiz_exam_prep', 'request_practical_exam'],
  },
  {
    level: 5,
    label: 'Validé',
    labelFr: 'Validé',
    labelAr: 'ناجح',
    unlockedFeatures: ['book_code', 'book_creneau', 'book_conduite', 'quiz_basic', 'quiz_advanced', 'quiz_exam_prep', 'request_theory_exam', 'request_practical_exam'],
  },
];

/**
 * Input for ranking up a student
 */
export interface RankUpInput {
  studentId: string;
  groupId: string;
  reason?: string;  // Optional reason for the rank up
}

/**
 * Input for setting a student's rank manually
 */
export interface SetRankInput {
  studentId: string;
  groupId: string;
  rank: number;
  reason?: string;
}

/**
 * Input for transferring a student to a new group
 */
export interface TransferGroupInput {
  studentId: string;
  newGroupId: string;
  reason?: string;
}
