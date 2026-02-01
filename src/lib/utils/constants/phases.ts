/**
 * Learning Phase Constants
 * Phase labels and transitions for the Algerian driving school curriculum
 */

import type { LearningPhase } from '@/lib/types/group';

// Phase display names (French for Algerian market)
export const PHASE_LABELS: Record<string, string> = {
  'code': 'Code',
  'creneau': 'Créneau',
  'conduite': 'Conduite',
  'exam-preparation': 'Prépa Examen',
  'passed': 'Validé ✓',
};

// Allowed phase transitions (only one step forward)
export const ALLOWED_TRANSITIONS: Record<string, LearningPhase | null> = {
  'code': 'creneau',
  'creneau': 'conduite',
  'conduite': 'exam-preparation',
  'exam-preparation': null, // passed is set via exam approval
  'passed': null,
};

// Phase badge colors for UI
export const PHASE_COLORS: Record<string, string> = {
  'code': 'bg-gray-100 text-gray-700',
  'creneau': 'bg-blue-100 text-blue-700',
  'conduite': 'bg-green-100 text-green-700',
  'exam-preparation': 'bg-orange-100 text-orange-700',
  'passed': 'bg-emerald-100 text-emerald-700',
};
