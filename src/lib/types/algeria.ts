/**
 * Algeria-Specific Type Definitions for Synapse E-Drive
 * Based on Algerian Driving Laws (Law 01-14 of 2001, Law 17-05 of 2017)
 */

// ============================================================================
// LICENSE CATEGORIES (Decree n° 25-169, June 22, 2025)
// ============================================================================

export type LicenseCategory = 
  | 'A1'    // Light motorcycles (≤125cc or ≤15kW)
  | 'A'     // Heavy motorcycles (>125cc or >15kW)
  | 'B'     // Standard automobiles (≤3,500kg, ≤8 passengers)
  | 'BE'    // B + trailers (>750kg, combined ≤4,250kg)
  | 'C1'    // Medium trucks (3,500-19,000kg)
  | 'C1E'   // C1 + trailers (>750kg, combined ≤20,000kg)
  | 'C'     // Heavy trucks (>19,000kg)
  | 'CE'    // C + trailers (>750kg, no limit)
  | 'D'     // Buses (>8 passengers)
  | 'DE'    // D + trailers (>750kg)
  | 'F';    // Disabled drivers (adapted vehicles)

export interface LicenseCategoryInfo {
  code: LicenseCategory;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  description: string;
  descriptionAr: string;
  minimumAge: number;
  requiresParentalConsent: boolean; // For ages 16-18
  validityYears: number;
  medicalExamFrequencyYears: number;
  medicalExamFrequencyOver65Years: number;
  vehicleSpecs: {
    maxWeight?: number;
    maxPassengers?: number;
    engineDisplacementMin?: number;
    engineDisplacementMax?: number;
    maxPowerKW?: number;
    trailerMaxWeight?: number;
    combinedMaxWeight?: number;
  };
  equivalentCategories: LicenseCategory[]; // Categories this license allows
}

// ============================================================================
// POINT SYSTEM (Law 17-05 of 2017)
// ============================================================================

export interface PointSystem {
  maxPoints: number;              // 24 points for full license
  probationaryPoints: number;     // 12 points for new drivers
  probationaryPeriodYears: number; // 2 years
  maxPointLossPerIncident: number; // Half of definitive capital (12)
}

export type ContraventionDegree = 1 | 2 | 3 | 4;

export interface Contravention {
  degree: ContraventionDegree;
  fineAmountDZD: number;
  pointsLost: number;
  examples: string[];
  examplesAr: string[];
}

export interface DelictualOffense {
  pointsLost: number;
  imprisonmentMonths: { min: number; max: number };
  fineAmountDZD: { min: number; max: number };
  examples: string[];
}

// ============================================================================
// SPEED LIMITS
// ============================================================================

export type RoadType = 'urban' | 'rural' | 'highway';
export type WeatherCondition = 'dry' | 'wet';

export interface SpeedLimit {
  roadType: RoadType;
  condition: WeatherCondition;
  limitKmh: number;
  probationaryLimitKmh: number; // For new drivers (80 km/h max)
}

export interface SpeedViolation {
  excessPercentage: { min: number; max: number };
  degree: ContraventionDegree | 'delictual';
  description: string;
}

// ============================================================================
// TRAINING REQUIREMENTS
// ============================================================================

export interface TrainingRequirements {
  totalHours: number;           // 55 hours total
  theoreticalHours: number;     // 25 hours
  practicalHours: number;       // 30 hours
  examDurationMinutes: number;  // 30 minutes practical test
  maxCandidatesPerSession: number; // 10 per driving school
  testFrequencyDays: number;    // Every 15 days
  schoolClosureMonth: number;   // August (8)
}

export interface InstructorTraining {
  categoryB: {
    durationWeeks: number;      // 15 weeks
    totalHours: number;         // 400 hours
  };
}

// ============================================================================
// MEDICAL REQUIREMENTS
// ============================================================================

export interface MedicalRequirements {
  assessments: string[];
  certificateSource: 'public_health' | 'approved_private';
  bloodTypeCertificationRequired: boolean;
}

// ============================================================================
// EXAM STRUCTURE
// ============================================================================

export type ExamLanguage = 'ar' | 'fr';

export interface TheoryExam {
  availableLanguages: ExamLanguage[];
  questionBankSize: number;     // 1000 questions (planned)
  topics: TheoryExamTopic[];
}

export interface TheoryExamTopic {
  id: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  description: string;
}

export interface PracticalExam {
  durationMinutes: number;
  evaluationCriteria: string[];
}

export interface MotorcycleExam {
  category: 'A1' | 'A';
  components: string[];
}

// ============================================================================
// QUIZ QUESTION (Algeria-specific)
// ============================================================================

export interface AlgeriaQuizQuestion {
  id: string;
  questionAr: string;
  questionFr: string;
  questionEn: string;
  type: 'multiple-choice' | 'true-false';
  options: {
    id: string;
    textAr: string;
    textFr: string;
    textEn: string;
  }[];
  correctAnswerId: string;
  explanation: {
    ar: string;
    fr: string;
    en: string;
  };
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lawReference?: string;
  points: number;
}

// ============================================================================
// USER PROFILE (Algeria-specific extensions)
// ============================================================================

export interface AlgeriaStudentProfile {
  // Personal Info
  nationalIdNumber?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  dateOfBirth?: Date;
  
  // License Info
  targetLicenseCategory: LicenseCategory;
  currentLicenseCategories?: LicenseCategory[];
  
  // Training Progress
  theoreticalHoursCompleted: number;
  practicalHoursCompleted: number;
  theoryExamPassed: boolean;
  theoryExamDate?: Date;
  practicalExamPassed: boolean;
  practicalExamDate?: Date;
  
  // Point System (for existing license holders)
  currentPoints?: number;
  isProbationary?: boolean;
  probationaryEndDate?: Date;
  
  // Medical
  medicalCertificateDate?: Date;
  medicalCertificateExpiry?: Date;
  
  // Preferences
  preferredLanguage: ExamLanguage;
  
  // Wilaya (Province)
  wilaya?: string;
  daira?: string; // District
}

// ============================================================================
// ROAD SIGNS
// ============================================================================

export type SignType = 'regulatory' | 'warning' | 'informational' | 'directional';
export type SignShape = 'circular' | 'triangular' | 'rectangular' | 'diamond' | 'octagonal';

export interface RoadSign {
  id: string;
  type: SignType;
  shape: SignShape;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  description: string;
  descriptionAr: string;
  imageUrl?: string;
  colorScheme: {
    background: string;
    border?: string;
    symbol: string;
  };
}

// ============================================================================
// SAFETY EQUIPMENT
// ============================================================================

export interface SafetyEquipment {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  mandatory: boolean;
  applicableVehicles: LicenseCategory[];
  penaltyDegree?: ContraventionDegree;
}

// ============================================================================
// ALGERIA WILAYAS (Provinces)
// ============================================================================

export interface Wilaya {
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
}
