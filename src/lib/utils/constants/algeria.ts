/**
 * Algeria-Specific Constants for Synapse E-Drive
 * Based on Algerian Driving Laws (Law 01-14 of 2001, Law 17-05 of 2017)
 */

import type {
  LicenseCategoryInfo,
  PointSystem,
  Contravention,
  DelictualOffense,
  SpeedLimit,
  SpeedViolation,
  TrainingRequirements,
  InstructorTraining,
  MedicalRequirements,
  TheoryExam,
  TheoryExamTopic,
  PracticalExam,
  SafetyEquipment,
  Wilaya,
} from '@/lib/types/algeria';

// ============================================================================
// LICENSE CATEGORIES
// ============================================================================

export const LICENSE_CATEGORIES: Record<string, LicenseCategoryInfo> = {
  A1: {
    code: 'A1',
    nameAr: 'الفئة أ1',
    nameFr: 'Catégorie A1',
    nameEn: 'Category A1',
    description: 'Light motorcycles (≤125cc or ≤15kW)',
    descriptionAr: 'دراجات نارية خفيفة (≤125 سم³ أو ≤15 كيلوواط)',
    minimumAge: 16,
    requiresParentalConsent: true,
    validityYears: 10,
    medicalExamFrequencyYears: 10,
    medicalExamFrequencyOver65Years: 5,
    vehicleSpecs: {
      engineDisplacementMin: 50,
      engineDisplacementMax: 125,
      maxPowerKW: 15,
    },
    equivalentCategories: [],
  },
  A: {
    code: 'A',
    nameAr: 'الفئة أ',
    nameFr: 'Catégorie A',
    nameEn: 'Category A',
    description: 'Heavy motorcycles (>125cc or >15kW)',
    descriptionAr: 'دراجات نارية ثقيلة (>125 سم³ أو >15 كيلوواط)',
    minimumAge: 18,
    requiresParentalConsent: true, // Until 19
    validityYears: 10,
    medicalExamFrequencyYears: 10,
    medicalExamFrequencyOver65Years: 5,
    vehicleSpecs: {
      engineDisplacementMin: 125,
    },
    equivalentCategories: ['A1'],
  },
  B: {
    code: 'B',
    nameAr: 'الفئة ب',
    nameFr: 'Catégorie B',
    nameEn: 'Category B',
    description: 'Standard automobiles (≤3,500kg, ≤8 passengers + driver)',
    descriptionAr: 'سيارات عادية (≤3500 كغ، ≤8 ركاب + السائق)',
    minimumAge: 18,
    requiresParentalConsent: true, // Until 19
    validityYears: 10,
    medicalExamFrequencyYears: 10,
    medicalExamFrequencyOver65Years: 5,
    vehicleSpecs: {
      maxWeight: 3500,
      maxPassengers: 9, // Including driver
      trailerMaxWeight: 750,
    },
    equivalentCategories: [],
  },
  BE: {
    code: 'BE',
    nameAr: 'الفئة ب(هـ)',
    nameFr: 'Catégorie B(E)',
    nameEn: 'Category B(E)',
    description: 'Category B + trailers (>750kg, combined ≤4,250kg)',
    descriptionAr: 'الفئة ب + مقطورات (>750 كغ، مجموع ≤4250 كغ)',
    minimumAge: 23,
    requiresParentalConsent: false,
    validityYears: 10,
    medicalExamFrequencyYears: 10,
    medicalExamFrequencyOver65Years: 5,
    vehicleSpecs: {
      maxWeight: 3500,
      trailerMaxWeight: 750,
      combinedMaxWeight: 4250,
    },
    equivalentCategories: ['B'],
  },
  C1: {
    code: 'C1',
    nameAr: 'الفئة ج1',
    nameFr: 'Catégorie C1',
    nameEn: 'Category C1',
    description: 'Medium trucks (3,500-19,000kg)',
    descriptionAr: 'شاحنات متوسطة (3500-19000 كغ)',
    minimumAge: 23,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {
      maxWeight: 19000,
      trailerMaxWeight: 750,
    },
    equivalentCategories: ['B'],
  },
  C1E: {
    code: 'C1E',
    nameAr: 'الفئة ج1(هـ)',
    nameFr: 'Catégorie C1(E)',
    nameEn: 'Category C1(E)',
    description: 'C1 + trailers (>750kg, combined ≤20,000kg)',
    descriptionAr: 'الفئة ج1 + مقطورات (>750 كغ، مجموع ≤20000 كغ)',
    minimumAge: 23,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {
      combinedMaxWeight: 20000,
    },
    equivalentCategories: ['C1', 'BE', 'B'],
  },
  C: {
    code: 'C',
    nameAr: 'الفئة ج',
    nameFr: 'Catégorie C',
    nameEn: 'Category C',
    description: 'Heavy trucks (>19,000kg)',
    descriptionAr: 'شاحنات ثقيلة (>19000 كغ)',
    minimumAge: 25,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {
      trailerMaxWeight: 750,
    },
    equivalentCategories: ['C1', 'B'],
  },
  CE: {
    code: 'CE',
    nameAr: 'الفئة ج(هـ)',
    nameFr: 'Catégorie C(E)',
    nameEn: 'Category C(E)',
    description: 'Category C + trailers (>750kg, no combined limit)',
    descriptionAr: 'الفئة ج + مقطورات (>750 كغ، بدون حد مجموع)',
    minimumAge: 25,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {},
    equivalentCategories: ['C', 'C1E', 'C1', 'BE', 'B'],
  },
  D: {
    code: 'D',
    nameAr: 'الفئة د',
    nameFr: 'Catégorie D',
    nameEn: 'Category D',
    description: 'Buses (>8 passengers + driver)',
    descriptionAr: 'حافلات (>8 ركاب + السائق)',
    minimumAge: 25,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {
      trailerMaxWeight: 750,
    },
    equivalentCategories: ['B'],
  },
  DE: {
    code: 'DE',
    nameAr: 'الفئة د(هـ)',
    nameFr: 'Catégorie D(E)',
    nameEn: 'Category D(E)',
    description: 'Category D + trailers (>750kg)',
    descriptionAr: 'الفئة د + مقطورات (>750 كغ)',
    minimumAge: 25,
    requiresParentalConsent: false,
    validityYears: 5,
    medicalExamFrequencyYears: 5,
    medicalExamFrequencyOver65Years: 2,
    vehicleSpecs: {},
    equivalentCategories: ['D', 'BE', 'B'],
  },
  F: {
    code: 'F',
    nameAr: 'الفئة و',
    nameFr: 'Catégorie F',
    nameEn: 'Category F',
    description: 'Disabled drivers (adapted vehicles)',
    descriptionAr: 'سائقون من ذوي الاحتياجات الخاصة (مركبات معدلة)',
    minimumAge: 16, // A1 equivalent
    requiresParentalConsent: true,
    validityYears: 10,
    medicalExamFrequencyYears: 10,
    medicalExamFrequencyOver65Years: 5,
    vehicleSpecs: {},
    equivalentCategories: [],
  },
};

// ============================================================================
// POINT SYSTEM
// ============================================================================

export const POINT_SYSTEM: PointSystem = {
  maxPoints: 24,
  probationaryPoints: 12,
  probationaryPeriodYears: 2,
  maxPointLossPerIncident: 12, // Half of 24
};

export const CONTRAVENTIONS: Record<number, Contravention> = {
  1: {
    degree: 1,
    fineAmountDZD: 2000,
    pointsLost: 1,
    examples: [
      'Equipment deficiencies',
      'Documentation issues',
      'Pedestrian-related minor offenses',
      'Not wearing seatbelt (occupant)',
    ],
    examplesAr: [
      'نقص في المعدات',
      'مشاكل في الوثائق',
      'مخالفات طفيفة متعلقة بالمشاة',
      'عدم ارتداء حزام الأمان (راكب)',
    ],
  },
  2: {
    degree: 2,
    fineAmountDZD: 2500,
    pointsLost: 2,
    examples: [
      'Excessive sound device use',
      'Improper use of reserved lanes',
      'Improper speed reduction',
      'Vehicle equipment violations',
      'Speed limit exceeded by ≤10%',
    ],
    examplesAr: [
      'استخدام مفرط للمنبه',
      'استخدام غير صحيح للممرات المخصصة',
      'تخفيض سرعة غير صحيح',
      'مخالفات معدات المركبة',
      'تجاوز حد السرعة بـ ≤10%',
    ],
  },
  3: {
    degree: 3,
    fineAmountDZD: 3000,
    pointsLost: 4,
    examples: [
      'Speed limit exceeded by 10-20%',
      'Improper seatbelt/helmet use (driver)',
      'Dangerous stopping on highways',
      'Vehicle maintenance deficiencies',
    ],
    examplesAr: [
      'تجاوز حد السرعة بنسبة 10-20%',
      'استخدام غير صحيح لحزام الأمان/الخوذة (سائق)',
      'توقف خطير على الطرق السريعة',
      'نقص في صيانة المركبة',
    ],
  },
  4: {
    degree: 4,
    fineAmountDZD: 5000,
    pointsLost: 6,
    examples: [
      'Improper direction of travel',
      'Intersection/priority violations',
      'Improper passing/crossing',
      'Failure to stop at stop signs',
      'Prohibited maneuvers on highways',
      'Accelerating to prevent overtaking',
      'Speed limit exceeded by 20-30%',
    ],
    examplesAr: [
      'اتجاه سير غير صحيح',
      'مخالفات التقاطعات/الأولوية',
      'تجاوز/عبور غير صحيح',
      'عدم التوقف عند علامات التوقف',
      'مناورات محظورة على الطرق السريعة',
      'التسارع لمنع التجاوز',
      'تجاوز حد السرعة بنسبة 20-30%',
    ],
  },
};

export const DELICTUAL_OFFENSE: DelictualOffense = {
  pointsLost: 10,
  imprisonmentMonths: { min: 6, max: 12 },
  fineAmountDZD: { min: 20000, max: 50000 },
  examples: [
    'Drunk driving causing death',
    'Dangerous driving causing injury',
    'Hit-and-run incidents',
    'Driving without valid license',
    'Speed limit exceeded by >30%',
  ],
};

// ============================================================================
// SPEED LIMITS
// ============================================================================

export const SPEED_LIMITS: SpeedLimit[] = [
  // Urban
  { roadType: 'urban', condition: 'dry', limitKmh: 50, probationaryLimitKmh: 50 },
  { roadType: 'urban', condition: 'wet', limitKmh: 40, probationaryLimitKmh: 40 },
  // Rural
  { roadType: 'rural', condition: 'dry', limitKmh: 80, probationaryLimitKmh: 80 },
  { roadType: 'rural', condition: 'wet', limitKmh: 80, probationaryLimitKmh: 80 },
  // Highway
  { roadType: 'highway', condition: 'dry', limitKmh: 120, probationaryLimitKmh: 80 },
  { roadType: 'highway', condition: 'wet', limitKmh: 110, probationaryLimitKmh: 80 },
];

export const SPEED_VIOLATIONS: SpeedViolation[] = [
  { excessPercentage: { min: 0, max: 10 }, degree: 2, description: '≤10% excess' },
  { excessPercentage: { min: 10, max: 20 }, degree: 3, description: '10-20% excess' },
  { excessPercentage: { min: 20, max: 30 }, degree: 4, description: '20-30% excess' },
  { excessPercentage: { min: 30, max: 100 }, degree: 'delictual', description: '>30% excess' },
];

// ============================================================================
// TRAINING REQUIREMENTS
// ============================================================================

export const TRAINING_REQUIREMENTS: TrainingRequirements = {
  totalHours: 55,
  theoreticalHours: 25,
  practicalHours: 30,
  examDurationMinutes: 30,
  maxCandidatesPerSession: 10,
  testFrequencyDays: 15,
  schoolClosureMonth: 8, // August
};

export const INSTRUCTOR_TRAINING: InstructorTraining = {
  categoryB: {
    durationWeeks: 15,
    totalHours: 400,
  },
};

// ============================================================================
// MEDICAL REQUIREMENTS
// ============================================================================

export const MEDICAL_REQUIREMENTS: MedicalRequirements = {
  assessments: [
    'Visual acuity and field of vision',
    'Color perception',
    'Auditory testing',
    'Cardiovascular evaluation',
    'Neurological assessment',
    'Reflexes and coordination',
    'Cognitive function',
    'Epilepsy screening',
    'Diabetes assessment',
    'Substance abuse screening',
  ],
  certificateSource: 'public_health',
  bloodTypeCertificationRequired: true,
};

// ============================================================================
// EXAM STRUCTURE
// ============================================================================

export const THEORY_EXAM_TOPICS: TheoryExamTopic[] = [
  {
    id: 'traffic-rules',
    nameEn: 'Traffic Rules and Regulations',
    nameAr: 'قواعد المرور واللوائح',
    nameFr: 'Règles de circulation et réglementations',
    description: 'Right-of-way, speed limits, passing regulations, intersection behavior',
  },
  {
    id: 'road-signs',
    nameEn: 'Road Signs and Markings',
    nameAr: 'إشارات الطرق والعلامات',
    nameFr: 'Panneaux de signalisation et marquages',
    description: 'Regulatory, warning, directional, and informational signs',
  },
  {
    id: 'vehicle-operation',
    nameEn: 'Vehicle Operation and Maintenance',
    nameAr: 'تشغيل المركبة وصيانتها',
    nameFr: 'Fonctionnement et entretien du véhicule',
    description: 'Vehicle controls, dashboard indicators, routine maintenance',
  },
  {
    id: 'speed-limits',
    nameEn: 'Speed Limits and Application',
    nameAr: 'حدود السرعة وتطبيقها',
    nameFr: 'Limites de vitesse et application',
    description: 'Urban, rural, highway limits; weather conditions; probationary restrictions',
  },
  {
    id: 'alcohol-impairment',
    nameEn: 'Alcohol and Impairment Regulations',
    nameAr: 'أنظمة الكحول والإعاقة',
    nameFr: 'Réglementations sur l\'alcool et les facultés affaiblies',
    description: 'Zero tolerance policy, testing procedures, penalties',
  },
  {
    id: 'safety-equipment',
    nameEn: 'Safety Equipment Requirements',
    nameAr: 'متطلبات معدات السلامة',
    nameFr: 'Exigences en matière d\'équipements de sécurité',
    description: 'Seatbelts, helmets, child safety, warning equipment',
  },
  {
    id: 'priority-rules',
    nameEn: 'Priority and Right-of-Way',
    nameAr: 'الأولوية وحق المرور',
    nameFr: 'Priorité et droit de passage',
    description: 'Intersection rules, roundabouts, emergency vehicles',
  },
  {
    id: 'point-system',
    nameEn: 'Point System and Penalties',
    nameAr: 'نظام النقاط والعقوبات',
    nameFr: 'Système de points et sanctions',
    description: 'Point allocation, contraventions, recovery options',
  },
];

export const THEORY_EXAM: TheoryExam = {
  availableLanguages: ['ar', 'fr'],
  questionBankSize: 1000,
  topics: THEORY_EXAM_TOPICS,
};

export const PRACTICAL_EXAM: PracticalExam = {
  durationMinutes: 30,
  evaluationCriteria: [
    'Vehicle control (starting, stopping, steering)',
    'Traffic rule compliance',
    'Speed limit adherence',
    'Lane usage and signaling',
    'Intersection behavior',
    'Roundabout navigation',
    'Hazard perception',
    'Following distance',
    'Parking skills',
    'Three-point turns',
    'Attitude and safety mindset',
  ],
};

// ============================================================================
// SAFETY EQUIPMENT
// ============================================================================

export const SAFETY_EQUIPMENT: SafetyEquipment[] = [
  {
    id: 'seatbelt-driver',
    nameAr: 'حزام الأمان (السائق)',
    nameFr: 'Ceinture de sécurité (conducteur)',
    nameEn: 'Seatbelt (Driver)',
    mandatory: true,
    applicableVehicles: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'],
    penaltyDegree: 3,
  },
  {
    id: 'seatbelt-passenger',
    nameAr: 'حزام الأمان (الركاب)',
    nameFr: 'Ceinture de sécurité (passagers)',
    nameEn: 'Seatbelt (Passengers)',
    mandatory: true,
    applicableVehicles: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'],
    penaltyDegree: 1,
  },
  {
    id: 'helmet-driver',
    nameAr: 'الخوذة (السائق)',
    nameFr: 'Casque (conducteur)',
    nameEn: 'Helmet (Driver)',
    mandatory: true,
    applicableVehicles: ['A1', 'A'],
    penaltyDegree: 3,
  },
  {
    id: 'helmet-passenger',
    nameAr: 'الخوذة (الراكب)',
    nameFr: 'Casque (passager)',
    nameEn: 'Helmet (Passenger)',
    mandatory: true,
    applicableVehicles: ['A1', 'A'],
    penaltyDegree: 3,
  },
  {
    id: 'warning-triangle',
    nameAr: 'مثلث التحذير',
    nameFr: 'Triangle de signalisation',
    nameEn: 'Warning Triangle',
    mandatory: true,
    applicableVehicles: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'],
    penaltyDegree: 1,
  },
  {
    id: 'reflective-vest',
    nameAr: 'سترة عاكسة',
    nameFr: 'Gilet réfléchissant',
    nameEn: 'Reflective Vest',
    mandatory: true,
    applicableVehicles: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'],
    penaltyDegree: 1,
  },
  {
    id: 'child-restraint',
    nameAr: 'مقعد أمان الأطفال',
    nameFr: 'Siège enfant',
    nameEn: 'Child Restraint System',
    mandatory: true,
    applicableVehicles: ['B', 'BE', 'F'],
    penaltyDegree: 1,
  },
];

// ============================================================================
// CHILD SAFETY
// ============================================================================

export const CHILD_SAFETY = {
  minAgeForFrontSeat: 10,
  requiresChildRestraint: true,
};

// ============================================================================
// ALCOHOL LIMITS
// ============================================================================

export const ALCOHOL_LIMITS = {
  maxBreathAlcoholMgPer100ml: 10, // Only for medicinal preparations
  zeroTolerance: true,
  description: 'Zero tolerance for alcohol from beverage consumption',
};

// ============================================================================
// ALGERIA WILAYAS (48 Provinces)
// ============================================================================

export const WILAYAS: Wilaya[] = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar', nameEn: 'Adrar' },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef', nameEn: 'Chlef' },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat', nameEn: 'Laghouat' },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', nameEn: 'Oum El Bouaghi' },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna', nameEn: 'Batna' },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa', nameEn: 'Béjaïa' },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra', nameEn: 'Biskra' },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar', nameEn: 'Béchar' },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida', nameEn: 'Blida' },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira', nameEn: 'Bouira' },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset', nameEn: 'Tamanrasset' },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa', nameEn: 'Tébessa' },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen', nameEn: 'Tlemcen' },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret', nameEn: 'Tiaret' },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', nameEn: 'Tizi Ouzou' },
  { code: '16', nameAr: 'الجزائر', nameFr: 'Alger', nameEn: 'Algiers' },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa', nameEn: 'Djelfa' },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel', nameEn: 'Jijel' },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif', nameEn: 'Sétif' },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda', nameEn: 'Saïda' },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda', nameEn: 'Skikda' },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', nameEn: 'Sidi Bel Abbès' },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba', nameEn: 'Annaba' },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma', nameEn: 'Guelma' },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine', nameEn: 'Constantine' },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa', nameEn: 'Médéa' },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem', nameEn: 'Mostaganem' },
  { code: '28', nameAr: 'المسيلة', nameFr: 'M\'Sila', nameEn: 'M\'Sila' },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara', nameEn: 'Mascara' },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla', nameEn: 'Ouargla' },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran', nameEn: 'Oran' },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh', nameEn: 'El Bayadh' },
  { code: '33', nameAr: 'إليزي', nameFr: 'Illizi', nameEn: 'Illizi' },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', nameEn: 'Bordj Bou Arréridj' },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès', nameEn: 'Boumerdès' },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf', nameEn: 'El Tarf' },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf', nameEn: 'Tindouf' },
  { code: '38', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', nameEn: 'Tissemsilt' },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued', nameEn: 'El Oued' },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela', nameEn: 'Khenchela' },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', nameEn: 'Souk Ahras' },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza', nameEn: 'Tipaza' },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila', nameEn: 'Mila' },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', nameEn: 'Aïn Defla' },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma', nameEn: 'Naâma' },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', nameEn: 'Aïn Témouchent' },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa', nameEn: 'Ghardaïa' },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane', nameEn: 'Relizane' },
];

// ============================================================================
// LEGAL REFERENCES
// ============================================================================

export const LEGAL_REFERENCES = {
  primaryLaw: 'Law 01-14 of August 19, 2001',
  majorAmendment: 'Law 17-05 of February 16, 2017',
  categoryDecree: 'Decree n° 25-169 of June 22, 2025',
  proposedHighwayCode: '190 articles (pending)',
};

// ============================================================================
// DRIVING SIDE
// ============================================================================

export const DRIVING_SIDE = 'right' as const;

// ============================================================================
// OVERTAKING RULES
// ============================================================================

export const OVERTAKING_RULES = {
  allowedSide: 'left' as const,
  rightSideOvertakingProhibited: true,
};
