/**
 * Lesson Types Constants
 * Specialized lesson types for Algerian driving schools
 * Aligned with local curriculum and requirements
 */

export interface LessonType {
  code: string;
  label: string;
  labelFr?: string; // French label
  labelAr?: string; // Arabic label
  type: 'theory' | 'practical' | 'specialized';
  duration: number; // in minutes
  groupSize: string; // e.g., '1', '10-20'
  requirements?: string;
  skills?: string[];
  description?: string;
}

export const LESSON_TYPES: Record<string, LessonType> = {
  // ============================================================================
  // THEORY LESSONS (for Groups)
  // ============================================================================
  THEORY_TRAFFIC_RULES: {
    code: 'theory-traffic-rules',
    label: 'Code de la Route - Traffic Rules',
    labelFr: 'Code de la Route - Règles de Circulation',
    labelAr: 'قانون الطريق - قواعد المرور',
    type: 'theory',
    duration: 120, // 2 hours
    groupSize: '10-20',
    description: 'Comprehensive traffic rules and regulations',
  },
  THEORY_ROAD_SIGNS: {
    code: 'theory-road-signs',
    label: 'Code de la Route - Road Signs',
    labelFr: 'Code de la Route - Signalisation Routière',
    labelAr: 'قانون الطريق - إشارات المرور',
    type: 'theory',
    duration: 120,
    groupSize: '10-20',
    description: 'Road signs, markings, and their meanings',
  },
  THEORY_PRIORITY_RULES: {
    code: 'theory-priority',
    label: 'Priority Rules & Intersections',
    labelFr: 'Règles de Priorité & Intersections',
    labelAr: 'قواعد الأولوية والتقاطعات',
    type: 'theory',
    duration: 120,
    groupSize: '10-20',
    description: 'Right of way, intersection rules, roundabouts',
  },
  THEORY_EXAM_PREP: {
    code: 'theory-exam-prep',
    label: 'Theory Exam Preparation',
    labelFr: 'Préparation à l\'Examen du Code',
    labelAr: 'التحضير لامتحان القيادة النظري',
    type: 'theory',
    duration: 120,
    groupSize: '10-20',
    description: 'Practice tests and exam preparation',
  },

  // ============================================================================
  // PRACTICAL LESSONS (Individual Bookings)
  // ============================================================================
  FIRST_DRIVING: {
    code: 'practical-first-lesson',
    label: 'First Driving Lesson',
    labelFr: 'Première Leçon de Conduite',
    labelAr: 'الدرس الأول في القيادة',
    type: 'practical',
    duration: 120,
    groupSize: '1',
    requirements: 'Theory exam passed',
    skills: ['Vehicle familiarity', 'Controls introduction', 'Basic movements'],
    description: 'Introduction to vehicle controls and basic movements',
  },
  BASIC_MANEUVERS: {
    code: 'practical-basic-maneuvers',
    label: 'Basic Maneuvers',
    labelFr: 'Manœuvres de Base',
    labelAr: 'المناورات الأساسية',
    type: 'practical',
    duration: 120,
    groupSize: '1',
    skills: ['Steering control', 'Gear changes', 'Smooth braking', 'Clutch control'],
    description: 'Fundamental driving skills and vehicle control',
  },
  CITY_DRIVING: {
    code: 'practical-city-driving',
    label: 'City Driving',
    labelFr: 'Conduite en Ville',
    labelAr: 'القيادة في المدينة',
    type: 'practical',
    duration: 120,
    groupSize: '1',
    requirements: 'Minimum 4 hours completed',
    skills: ['Lane discipline', 'Traffic awareness', 'Pedestrian awareness', 'Turn signals'],
    description: 'Navigating city streets and urban traffic',
  },
  PARKING_CRENEAU: {
    code: 'practical-parking-creneau',
    label: 'Parking Practice (Créneau)',
    labelFr: 'Stationnement (Créneau)',
    labelAr: 'تدريب الركن (الموازي)',
    type: 'practical',
    duration: 90,
    groupSize: '1',
    skills: ['Parallel parking', 'Reverse parking', 'Bay parking', 'Mirror usage'],
    description: 'Mastering different parking techniques',
  },
  ROUNDABOUTS: {
    code: 'practical-roundabouts',
    label: 'Roundabouts & Intersections',
    labelFr: 'Ronds-points & Intersections',
    labelAr: 'الدوارات والتقاطعات',
    type: 'practical',
    duration: 90,
    groupSize: '1',
    requirements: 'Minimum 6 hours completed',
    skills: ['Roundabout navigation', 'Lane selection', 'Yielding', 'Exit technique'],
    description: 'Navigating roundabouts and complex intersections',
  },
  HIGHWAY: {
    code: 'practical-highway',
    label: 'Highway Driving',
    labelFr: 'Conduite sur Autoroute',
    labelAr: 'القيادة على الطريق السريع',
    type: 'practical',
    duration: 120,
    groupSize: '1',
    requirements: 'Minimum 10 hours completed',
    skills: ['Highway merging', 'Lane changes', 'Speed management', 'Safe following distance'],
    description: 'High-speed driving and highway rules',
  },
  PRE_EXAM: {
    code: 'practical-pre-exam',
    label: 'Pre-Exam Practice',
    labelFr: 'Entraînement Pré-Examen',
    labelAr: 'تدريب ما قبل الامتحان',
    type: 'practical',
    duration: 90,
    groupSize: '1',
    requirements: 'Minimum 18 hours completed',
    skills: ['Exam route practice', 'Maneuver review', 'Confidence building'],
    description: 'Final preparation for the practical driving exam',
  },

  // ============================================================================
  // SPECIALIZED LESSONS
  // ============================================================================
  DEFENSIVE_DRIVING: {
    code: 'specialized-defensive',
    label: 'Defensive Driving',
    labelFr: 'Conduite Défensive',
    labelAr: 'القيادة الدفاعية',
    type: 'specialized',
    duration: 120,
    groupSize: '1',
    requirements: 'Minimum 12 hours completed',
    skills: ['Hazard perception', 'Emergency braking', 'Anticipation'],
    description: 'Advanced safety techniques and hazard awareness',
  },
  NIGHT_DRIVING: {
    code: 'specialized-night',
    label: 'Night Driving',
    labelFr: 'Conduite de Nuit',
    labelAr: 'القيادة الليلية',
    type: 'specialized',
    duration: 90,
    groupSize: '1',
    requirements: 'Minimum 15 hours completed',
    skills: ['Low visibility driving', 'Headlight usage', 'Fatigue awareness'],
    description: 'Safe driving techniques for nighttime conditions',
  },
  ADVERSE_CONDITIONS: {
    code: 'specialized-adverse',
    label: 'Adverse Weather Driving',
    labelFr: 'Conduite par Mauvais Temps',
    labelAr: 'القيادة في الطقس السيء',
    type: 'specialized',
    duration: 90,
    groupSize: '1',
    requirements: 'Minimum 12 hours completed',
    skills: ['Rain driving', 'Reduced visibility', 'Skid prevention'],
    description: 'Handling challenging weather conditions',
  },
} as const;

// Helper arrays for dropdowns
export const LESSON_TYPE_OPTIONS = Object.values(LESSON_TYPES).map(lt => ({
  value: lt.code,
  label: lt.label,
  type: lt.type,
  duration: lt.duration,
}));

export const THEORY_LESSON_TYPES = Object.values(LESSON_TYPES)
  .filter(lt => lt.type === 'theory')
  .map(lt => ({ value: lt.code, label: lt.label }));

export const PRACTICAL_LESSON_TYPES = Object.values(LESSON_TYPES)
  .filter(lt => lt.type === 'practical')
  .map(lt => ({ value: lt.code, label: lt.label }));

export const SPECIALIZED_LESSON_TYPES = Object.values(LESSON_TYPES)
  .filter(lt => lt.type === 'specialized')
  .map(lt => ({ value: lt.code, label: lt.label }));

// Get lesson type by code
export function getLessonTypeByCode(code: string): LessonType | undefined {
  return Object.values(LESSON_TYPES).find(lt => lt.code === code);
}

// Get all skills for tracking
export const ALL_DRIVING_SKILLS = [
  'Steering Control',
  'Gear Changes',
  'Smooth Braking',
  'Clutch Control',
  'Parallel Parking',
  'Reverse Parking',
  'Bay Parking',
  'Highway Merging',
  'Lane Discipline',
  'Mirror Usage',
  'Turn Signals',
  'Speed Control',
  'Hazard Awareness',
  'Roundabout Navigation',
  'Pedestrian Awareness',
  'Traffic Light Compliance',
  'Safe Following Distance',
  'Emergency Stops',
  'Hill Starts',
  'Three-Point Turn',
];

// Minimum hours required for practical exam in Algeria
export const MIN_HOURS_FOR_EXAM = 20;
export const MIN_RATING_FOR_EXAM = 3.5;
