/**
 * Algeria Driving Code Quiz Questions
 * Based on Algerian Driving Laws (Law 01-14 of 2001, Law 17-05 of 2017)
 * 
 * This question bank is designed to match the official Algerian "Code de la Route" exam
 */

import type { AlgeriaQuizQuestion } from '@/lib/types/algeria';

export const ALGERIA_QUIZ_QUESTIONS: AlgeriaQuizQuestion[] = [
  // ============================================================================
  // TRAFFIC RULES AND REGULATIONS (Questions 1-10)
  // ============================================================================
  {
    id: 'tr-001',
    questionAr: 'ما هو الحد الأدنى للسن للحصول على رخصة القيادة من الفئة ب (سيارة عادية) في الجزائر؟',
    questionFr: 'Quel est l\'âge minimum requis pour obtenir un permis de conduire de catégorie B (automobile standard) en Algérie ?',
    questionEn: 'What is the minimum age requirement for obtaining a Category B (standard automobile) driving license in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '17 سنة', textFr: '17 ans', textEn: '17 years' },
      { id: 'b', textAr: '18 سنة', textFr: '18 ans', textEn: '18 years' },
      { id: 'c', textAr: '19 سنة', textFr: '19 ans', textEn: '19 years' },
      { id: 'd', textAr: '21 سنة', textFr: '21 ans', textEn: '21 years' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الحد الأدنى للسن للحصول على رخصة الفئة ب هو 18 سنة في الجزائر.',
      fr: 'L\'âge minimum pour le permis de catégorie B est de 18 ans en Algérie.',
      en: 'The minimum age for Category B permits is 18 years in Algeria.',
    },
    topic: 'traffic-rules',
    difficulty: 'easy',
    lawReference: 'Decree n° 25-169',
    points: 1,
  },
  {
    id: 'tr-002',
    questionAr: 'عندما تصل سيارتان إلى تقاطع غير منظم في نفس الوقت، أي سيارة لها الأولوية؟',
    questionFr: 'Lorsque deux véhicules arrivent simultanément à une intersection non contrôlée, lequel a la priorité ?',
    questionEn: 'When two vehicles arrive at an uncontrolled intersection simultaneously, which vehicle has priority?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'السيارة على اليسار', textFr: 'Le véhicule à gauche', textEn: 'The vehicle on the left' },
      { id: 'b', textAr: 'السيارة على اليمين', textFr: 'Le véhicule à droite', textEn: 'The vehicle on the right' },
      { id: 'c', textAr: 'السيارة الأكبر', textFr: 'Le véhicule le plus grand', textEn: 'The larger vehicle' },
      { id: 'd', textAr: 'السيارة التي دخلت أولاً', textFr: 'Le véhicule qui est entré en premier', textEn: 'The vehicle that entered first' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'وفقاً لقواعد المرور الجزائرية، عندما تصل السيارات في نفس الوقت إلى تقاطع بدون أجهزة تحكم أو علامات أولوية، فإن السيارة الموجودة على اليمين لها الأولوية.',
      fr: 'Selon les règles de circulation algériennes, lorsque des véhicules arrivent simultanément à une intersection sans dispositifs de contrôle ou panneaux de priorité, le véhicule positionné à droite a la priorité.',
      en: 'Under Algerian traffic rules, when vehicles arrive simultaneously at an intersection without traffic control devices or priority signs, the vehicle positioned on the right has priority.',
    },
    topic: 'traffic-rules',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-003',
    questionAr: 'ما هو الحد الأقصى للسرعة في المناطق الحضرية في الجزائر في ظروف جافة؟',
    questionFr: 'Quelle est la limite de vitesse maximale dans les zones urbaines en Algérie par temps sec ?',
    questionEn: 'What is the maximum speed limit in urban areas in Algeria under dry conditions?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '40 كم/س', textFr: '40 km/h', textEn: '40 km/h' },
      { id: 'b', textAr: '50 كم/س', textFr: '50 km/h', textEn: '50 km/h' },
      { id: 'c', textAr: '60 كم/س', textFr: '60 km/h', textEn: '60 km/h' },
      { id: 'd', textAr: '70 كم/س', textFr: '70 km/h', textEn: '70 km/h' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الحد الأقصى للسرعة في المناطق الحضرية في الجزائر هو 50 كم/س في الظروف الجافة، وينخفض إلى 40 كم/س عندما تكون الطرق مبللة.',
      fr: 'La limite de vitesse urbaine standard en Algérie est de 50 km/h par temps sec, réduite à 40 km/h lorsque les routes sont mouillées.',
      en: 'The standard urban speed limit in Algeria is 50 km/h under dry conditions, reduced to 40 km/h when roads are wet.',
    },
    topic: 'speed-limits',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-004',
    questionAr: 'ما هو الحد الأقصى للسرعة على الطريق السريع للسائق الجديد خلال فترة الاختبار؟',
    questionFr: 'Quelle est la limite de vitesse sur autoroute pour un nouveau conducteur pendant sa période probatoire ?',
    questionEn: 'What is the highway speed limit for a new driver during their probationary period?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '80 كم/س', textFr: '80 km/h', textEn: '80 km/h' },
      { id: 'b', textAr: '100 كم/س', textFr: '100 km/h', textEn: '100 km/h' },
      { id: 'c', textAr: '120 كم/س', textFr: '120 km/h', textEn: '120 km/h' },
      { id: 'd', textAr: 'نفس السائقين ذوي الخبرة', textFr: 'Identique aux conducteurs expérimentés', textEn: 'The same as experienced drivers' },
    ],
    correctAnswerId: 'a',
    explanation: {
      ar: 'السائقون الجدد خلال فترة الاختبار لمدة سنتين محدودون بسرعة 80 كم/س كحد أقصى بغض النظر عن نوع الطريق.',
      fr: 'Les nouveaux conducteurs pendant leur période probatoire de deux ans sont limités à une vitesse maximale de 80 km/h quel que soit le type de route.',
      en: 'New drivers during their two-year probationary period are limited to a maximum speed of 80 km/h regardless of road type.',
    },
    topic: 'speed-limits',
    difficulty: 'medium',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'tr-005',
    questionAr: 'في الجزائر، على أي جانب من الطريق يجب أن تسير المركبات؟',
    questionFr: 'En Algérie, de quel côté de la route les véhicules doivent-ils circuler ?',
    questionEn: 'In Algeria, what side of the road must vehicles travel on?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'الجانب الأيسر', textFr: 'Le côté gauche', textEn: 'The left side' },
      { id: 'b', textAr: 'الجانب الأيمن', textFr: 'Le côté droit', textEn: 'The right side' },
      { id: 'c', textAr: 'وسط الطريق', textFr: 'Le centre de la route', textEn: 'The center of the road' },
      { id: 'd', textAr: 'أي جانب حسب الطريق', textFr: 'N\'importe quel côté, selon la route', textEn: 'Either side, depending on the road' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'تسير المركبات في الجزائر على الجانب الأيمن من الطريق، بما يتوافق مع معظم الدول الأوروبية القارية وشمال أفريقيا.',
      fr: 'Les véhicules en Algérie circulent sur le côté droit de la route, conformément à la plupart des pays d\'Europe continentale et d\'Afrique du Nord.',
      en: 'Vehicles in Algeria drive on the right side of the road, consistent with most continental European and North African countries.',
    },
    topic: 'traffic-rules',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-006',
    questionAr: 'في الدوار، أي المركبات لها الأولوية؟',
    questionFr: 'Dans un rond-point, quels véhicules ont la priorité ?',
    questionEn: 'At a roundabout, which vehicles have priority?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'المركبات التي تدخل الدوار', textFr: 'Les véhicules entrant dans le rond-point', textEn: 'Vehicles entering the roundabout' },
      { id: 'b', textAr: 'المركبات التي تدور بالفعل في الدوار', textFr: 'Les véhicules déjà en circulation dans le rond-point', textEn: 'Vehicles already circulating in the roundabout' },
      { id: 'c', textAr: 'المركبات الأكبر', textFr: 'Les véhicules plus grands', textEn: 'Larger vehicles' },
      { id: 'd', textAr: 'مركبات الطوارئ فقط', textFr: 'Uniquement les véhicules d\'urgence', textEn: 'Emergency vehicles only' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'وفقاً لقواعد المرور الجزائرية، المركبات التي تدور بالفعل داخل الدوار لها الأولوية على المركبات التي تحاول الدخول. يجب على المركبات الداخلة انتظار فجوات مناسبة.',
      fr: 'Selon les règles de circulation algériennes, les véhicules déjà en circulation dans un rond-point ont la priorité sur les véhicules qui tentent d\'y entrer. Les véhicules entrants doivent attendre des intervalles appropriés.',
      en: 'Under Algerian traffic rules, vehicles already circulating within a roundabout have priority over vehicles seeking to enter. Entering vehicles must wait for suitable gaps.',
    },
    topic: 'traffic-rules',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-007',
    questionAr: 'ما هو الحد الأقصى المسموح به لتركيز الكحول في الدم للسائقين في الجزائر؟',
    questionFr: 'Quelle est la concentration maximale d\'alcool dans le sang autorisée pour les conducteurs en Algérie ?',
    questionEn: 'What is the maximum blood alcohol concentration permitted for drivers in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '0.05%', textFr: '0,05%', textEn: '0.05%' },
      { id: 'b', textAr: '0.08%', textFr: '0,08%', textEn: '0.08%' },
      { id: 'c', textAr: '0.02%', textFr: '0,02%', textEn: '0.02%' },
      { id: 'd', textAr: 'عدم التسامح بشكل أساسي', textFr: 'Essentiellement tolérance zéro', textEn: 'Essentially zero tolerance' },
    ],
    correctAnswerId: 'd',
    explanation: {
      ar: 'تطبق الجزائر سياسة عدم التسامح مع الكحول في القيادة. الحد القانوني هو 10 ملغ لكل 100 مل من هواء الزفير، مسموح به فقط للكحول الناتج عن المستحضرات الطبية. أي كحول قابل للكشف من استهلاك المشروبات محظور.',
      fr: 'L\'Algérie applique une politique de tolérance zéro pour l\'alcool au volant. La limite légale est de 10 mg par 100 ml d\'air expiré, autorisée uniquement pour l\'alcool provenant de préparations médicinales. Tout alcool détectable provenant de la consommation de boissons est interdit.',
      en: 'Algeria enforces effectively zero tolerance for alcohol in driving. The legal limit is 10mg per 100ml of breath, permitted only for alcohol from medicinal preparations. Any detectable alcohol from beverage consumption is prohibited.',
    },
    topic: 'alcohol-impairment',
    difficulty: 'medium',
    points: 1,
  },
  {
    id: 'tr-008',
    questionAr: 'هل يُسمح بالتجاوز من الجانب الأيمن في الجزائر؟',
    questionFr: 'Le dépassement par la droite est-il autorisé en Algérie ?',
    questionEn: 'Is overtaking on the right side permitted in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'نعم، عندما تتحرك المركبة الأمامية ببطء', textFr: 'Oui, lorsque le véhicule devant roule lentement', textEn: 'Yes, when the vehicle ahead is moving slowly' },
      { id: 'b', textAr: 'نعم، على الطرق متعددة المسارات', textFr: 'Oui, sur les routes à plusieurs voies', textEn: 'Yes, on multi-lane roads' },
      { id: 'c', textAr: 'لا، يجب أن يكون التجاوز دائماً من اليسار', textFr: 'Non, le dépassement doit toujours se faire par la gauche', textEn: 'No, overtaking must always be on the left' },
      { id: 'd', textAr: 'فقط على الطرق السريعة', textFr: 'Uniquement sur les autoroutes', textEn: 'Only on highways' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'التجاوز من اليمين محظور في الجزائر. يجب على السائقين التجاوز من الجانب الأيسر فقط، وقد يؤدي التجاوز من الجانب الأيمن إلى غرامات أو تعليق الرخصة.',
      fr: 'Le dépassement par la droite est interdit en Algérie. Les conducteurs doivent dépasser uniquement par la gauche, et le dépassement par la droite peut entraîner des amendes ou une suspension du permis.',
      en: 'Overtaking on the right is prohibited in Algeria. Drivers must overtake only on the left side, and right-side overtaking may result in fines or license suspension.',
    },
    topic: 'traffic-rules',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-009',
    questionAr: 'ما هو الحد الأقصى للسرعة على الطرق الريفية (غير السريعة) في الجزائر؟',
    questionFr: 'Quelle est la limite de vitesse maximale sur les routes rurales (non autoroutières) en Algérie ?',
    questionEn: 'What is the maximum speed limit on rural roads (non-highway) in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '60 كم/س', textFr: '60 km/h', textEn: '60 km/h' },
      { id: 'b', textAr: '80 كم/س', textFr: '80 km/h', textEn: '80 km/h' },
      { id: 'c', textAr: '100 كم/س', textFr: '100 km/h', textEn: '100 km/h' },
      { id: 'd', textAr: '110 كم/س', textFr: '110 km/h', textEn: '110 km/h' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الحد الأقصى للسرعة على الطرق الريفية خارج المناطق الحضرية هو 80 كم/س في الظروف العادية.',
      fr: 'La limite de vitesse sur les routes rurales en dehors des zones urbaines est de 80 km/h dans des conditions normales.',
      en: 'The speed limit on rural roads outside urban areas is 80 km/h under normal conditions.',
    },
    topic: 'speed-limits',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'tr-010',
    questionAr: 'ما هي عقوبة القيادة بدون رخصة صالحة لفئة المركبة المُشغَّلة؟',
    questionFr: 'Quelle est la sanction pour conduire sans permis valide pour la catégorie de véhicule conduit ?',
    questionEn: 'What is the penalty for driving without a valid license for the vehicle category being operated?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'تحذير فقط', textFr: 'Avertissement uniquement', textEn: 'Warning only' },
      { id: 'b', textAr: 'غرامة فقط', textFr: 'Amende uniquement', textEn: 'Fine only' },
      { id: 'c', textAr: 'سجن 6 أشهر إلى سنة + غرامة + حظر سنة من التقدم', textFr: 'Emprisonnement de 6 mois à 1 an + amende + interdiction d\'un an de candidature', textEn: 'Imprisonment of 6 months to 1 year plus fine, plus 1-year ban from applying' },
      { id: 'd', textAr: 'حجز المركبة فقط', textFr: 'Confiscation du véhicule uniquement', textEn: 'Vehicle impoundment only' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'تشغيل مركبة بدون رخصة الفئة المناسبة يحمل عقوبات السجن من ستة أشهر إلى سنة، وغرامات من 20,000 إلى 50,000 دينار، وحظر إضافي لمدة سنة من التقدم لأي فئة رخصة.',
      fr: 'Conduire un véhicule sans le permis de catégorie approprié entraîne des peines d\'emprisonnement de six mois à un an, des amendes de 20 000 à 50 000 dinars, et une interdiction supplémentaire d\'un an de candidature à toute catégorie de permis.',
      en: 'Operating a vehicle without the appropriate category license carries penalties of imprisonment from six months to one year, fines from 20,000 to 50,000 dinars, and an additional one-year prohibition from applying for any permit category.',
    },
    topic: 'traffic-rules',
    difficulty: 'hard',
    lawReference: 'Law 01-14 Article 8',
    points: 2,
  },

  // ============================================================================
  // ROAD SIGNS (Questions 11-15)
  // ============================================================================
  {
    id: 'rs-001',
    questionAr: 'ما هو الشكل المستخدم عادةً للإشارات التنظيمية التي تشير إلى الإجراءات الإلزامية؟',
    questionFr: 'Quelle forme est généralement utilisée pour les panneaux réglementaires indiquant des actions obligatoires ?',
    questionEn: 'What shape is typically used for regulatory signs indicating mandatory actions?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'مثلث', textFr: 'Triangulaire', textEn: 'Triangular' },
      { id: 'b', textAr: 'مربع', textFr: 'Carré', textEn: 'Square' },
      { id: 'c', textAr: 'دائري', textFr: 'Circulaire', textEn: 'Circular' },
      { id: 'd', textAr: 'معين', textFr: 'Losange', textEn: 'Diamond' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'تستخدم الإشارات التنظيمية الإلزامية في الجزائر تصاميم دائرية، عادةً بخلفيات زرقاء ورموز بيضاء.',
      fr: 'Les panneaux réglementaires obligatoires en Algérie utilisent des formes circulaires, généralement avec des fonds bleus et des symboles blancs.',
      en: 'Mandatory regulatory signs in Algeria use circular designs, typically with blue backgrounds and white symbols.',
    },
    topic: 'road-signs',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'rs-002',
    questionAr: 'ما هو الشكل ونظام الألوان الذي يشير إلى إشارة تحذير في الجزائر؟',
    questionFr: 'Quelle forme et quel code couleur indiquent un panneau d\'avertissement en Algérie ?',
    questionEn: 'What shape and color scheme indicates a warning sign in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'مثلث بحدود حمراء وخلفية بيضاء', textFr: 'Triangulaire avec bordure rouge et fond blanc', textEn: 'Triangular with red border and white background' },
      { id: 'b', textAr: 'دائري بحدود حمراء', textFr: 'Circulaire avec bordure rouge', textEn: 'Circular with red border' },
      { id: 'c', textAr: 'مربع بخلفية زرقاء', textFr: 'Carré avec fond bleu', textEn: 'Square with blue background' },
      { id: 'd', textAr: 'مستطيل بخلفية خضراء', textFr: 'Rectangulaire avec fond vert', textEn: 'Rectangular with green background' },
    ],
    correctAnswerId: 'a',
    explanation: {
      ar: 'تستخدم إشارات التحذير تصاميم مثلثة بحدود حمراء على خلفيات بيضاء، لتنبيه السائقين للمخاطر القادمة.',
      fr: 'Les panneaux d\'avertissement utilisent des formes triangulaires avec des bordures rouges sur des fonds blancs, alertant les conducteurs des dangers à venir.',
      en: 'Warning signs employ triangular designs with red borders on white backgrounds, alerting drivers to upcoming hazards.',
    },
    topic: 'road-signs',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'rs-003',
    questionAr: 'ماذا تشير الإشارات المرورية المثلثة ذات الحدود الحمراء؟',
    questionFr: 'Qu\'indiquent les panneaux routiers triangulaires avec des bordures rouges ?',
    questionEn: 'What do triangular road signs with red borders indicate?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'إجراءات إلزامية', textFr: 'Actions obligatoires', textEn: 'Mandatory actions' },
      { id: 'b', textAr: 'محظورات', textFr: 'Interdictions', textEn: 'Prohibitions' },
      { id: 'c', textAr: 'تحذيرات من مخاطر قادمة', textFr: 'Avertissements de dangers à venir', textEn: 'Warnings of hazards ahead' },
      { id: 'd', textAr: 'معلومات عن الخدمات', textFr: 'Informations sur les services', textEn: 'Information about services' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'الإشارات المثلثة ذات الحدود الحمراء هي إشارات تحذير تنبه السائقين للمخاطر القادمة التي تتطلب انتباهاً متزايداً.',
      fr: 'Les panneaux triangulaires avec des bordures rouges sont des panneaux d\'avertissement qui alertent les conducteurs des dangers à venir nécessitant une attention accrue.',
      en: 'Triangular signs with red borders are warning signs that alert drivers to hazards ahead requiring heightened attention.',
    },
    topic: 'road-signs',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'rs-004',
    questionAr: 'ما هو لون إشارات الاتجاهات لوجهات الطرق السريعة في الجزائر؟',
    questionFr: 'Quelle est la couleur des panneaux directionnels pour les destinations autoroutières en Algérie ?',
    questionEn: 'What color are directional signs for highway destinations in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'أزرق', textFr: 'Bleu', textEn: 'Blue' },
      { id: 'b', textAr: 'أخضر', textFr: 'Vert', textEn: 'Green' },
      { id: 'c', textAr: 'بني', textFr: 'Marron', textEn: 'Brown' },
      { id: 'd', textAr: 'أبيض', textFr: 'Blanc', textEn: 'White' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'تستخدم إشارات الاتجاهات لوجهات الطرق السريعة خلفيات خضراء، بينما تستخدم الإشارات المعلوماتية خلفيات زرقاء.',
      fr: 'Les panneaux directionnels pour les destinations autoroutières utilisent des fonds verts, tandis que les panneaux d\'information utilisent des fonds bleus.',
      en: 'Directional signs for highway destinations use green backgrounds, while informational signs use blue backgrounds.',
    },
    topic: 'road-signs',
    difficulty: 'medium',
    points: 1,
  },
  {
    id: 'rs-005',
    questionAr: 'ماذا تشير الإشارة الدائرية ذات الحدود الحمراء والخط القطري؟',
    questionFr: 'Qu\'indique un panneau circulaire avec une bordure rouge et une ligne diagonale ?',
    questionEn: 'What does a circular sign with a red border and diagonal line indicate?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'توقف فوراً', textFr: 'Arrêt immédiat', textEn: 'Stop immediately' },
      { id: 'b', textAr: 'أعط الأولوية للمرور القادم', textFr: 'Cédez le passage au trafic venant en sens inverse', textEn: 'Yield to oncoming traffic' },
      { id: 'c', textAr: 'حظر أو نهاية إذن', textFr: 'Interdiction ou fin d\'autorisation', textEn: 'A prohibition or end of permission' },
      { id: 'd', textAr: 'الحد الأقصى للسرعة', textFr: 'Limite de vitesse maximale', textEn: 'Maximum speed limit' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'الإشارات الدائرية ذات الحدود الحمراء والخطوط القطرية (أو الدوائر الحمراء الصلبة) تشير إلى الإجراءات المحظورة أو نهاية نشاط مسموح به سابقاً.',
      fr: 'Les panneaux circulaires avec des bordures rouges et des lignes diagonales (ou des cercles rouges pleins) indiquent des actions interdites ou la fin d\'une activité précédemment autorisée.',
      en: 'Circular signs with red borders and diagonal lines (or solid red circles) indicate prohibited actions or the end of a previously permitted activity.',
    },
    topic: 'road-signs',
    difficulty: 'medium',
    points: 1,
  },

  // ============================================================================
  // VEHICLE CATEGORIES (Questions 16-20)
  // ============================================================================
  {
    id: 'vc-001',
    questionAr: 'ما هي فئة الرخصة المطلوبة لتشغيل دراجة نارية بمحرك 150 سم³؟',
    questionFr: 'Quelle catégorie de permis est requise pour conduire une moto de 150 cm³ ?',
    questionEn: 'What category of license is required to operate a motorcycle with 150cc engine?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'أ1', textFr: 'A1', textEn: 'A1' },
      { id: 'b', textAr: 'أ', textFr: 'A', textEn: 'A' },
      { id: 'c', textAr: 'ب', textFr: 'B', textEn: 'B' },
      { id: 'd', textAr: 'ج', textFr: 'C', textEn: 'C' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الفئة أ مطلوبة للدراجات النارية التي تتجاوز 125 سم³ أو قوة 15 كيلوواط. دراجة نارية 150 سم³ تندرج تحت هذه الفئة.',
      fr: 'La catégorie A est requise pour les motos dépassant 125 cm³ ou 15 kW de puissance. Une moto de 150 cm³ entre dans cette catégorie.',
      en: 'Category A is required for motorcycles exceeding 125cc or 15kW power. A 150cc motorcycle falls into this category.',
    },
    topic: 'vehicle-categories',
    difficulty: 'medium',
    lawReference: 'Decree n° 25-169',
    points: 1,
  },
  {
    id: 'vc-002',
    questionAr: 'ما هو الحد الأقصى لوزن المركبة لتشغيل رخصة الفئة ب؟',
    questionFr: 'Quel est le poids maximal du véhicule pour le permis de catégorie B ?',
    questionEn: 'What is the maximum vehicle weight for Category B license operation?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '2,500 كغ', textFr: '2 500 kg', textEn: '2,500 kg' },
      { id: 'b', textAr: '3,500 كغ', textFr: '3 500 kg', textEn: '3,500 kg' },
      { id: 'c', textAr: '4,500 كغ', textFr: '4 500 kg', textEn: '4,500 kg' },
      { id: 'd', textAr: '5,000 كغ', textFr: '5 000 kg', textEn: '5,000 kg' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الفئة ب تسمح بتشغيل المركبات التي لا يتجاوز وزنها الإجمالي 3,500 كغ.',
      fr: 'La catégorie B permet de conduire des véhicules dont le poids total autorisé en charge n\'excède pas 3 500 kg.',
      en: 'Category B permits operation of vehicles with gross vehicle weight rating not exceeding 3,500 kg.',
    },
    topic: 'vehicle-categories',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'vc-003',
    questionAr: 'ما هو الحد الأدنى للسن لرخصة الفئة أ1 (الدراجات النارية الخفيفة)؟',
    questionFr: 'Quel est l\'âge minimum pour le permis de catégorie A1 (motos légères) ?',
    questionEn: 'What is the minimum age for Category A1 (light motorcycle) license?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '16 سنة', textFr: '16 ans', textEn: '16 years' },
      { id: 'b', textAr: '18 سنة', textFr: '18 ans', textEn: '18 years' },
      { id: 'c', textAr: '20 سنة', textFr: '20 ans', textEn: '20 years' },
      { id: 'd', textAr: '21 سنة', textFr: '21 ans', textEn: '21 years' },
    ],
    correctAnswerId: 'a',
    explanation: {
      ar: 'يمكن الحصول على رخصة الفئة أ1 في سن 16، على الرغم من أن المرشحين تحت 19 سنة يحتاجون إلى موافقة الوالدين لأن سن الرشد القانوني في الجزائر هو 19.',
      fr: 'Le permis de catégorie A1 peut être obtenu à 16 ans, bien que les candidats de moins de 19 ans nécessitent une autorisation parentale car la majorité légale en Algérie est de 19 ans.',
      en: 'Category A1 permits can be obtained at age 16, though candidates under 19 require parental authorization due to Algeria\'s legal majority being 19.',
    },
    topic: 'vehicle-categories',
    difficulty: 'medium',
    points: 1,
  },
  {
    id: 'vc-004',
    questionAr: 'ما هي الفئة التي تسمح بسحب مقطورة تزيد عن 750 كغ عندما يكون الوزن المجمع أقل من 4,250 كغ؟',
    questionFr: 'Quelle catégorie permet de tracter une remorque de plus de 750 kg lorsque le poids combiné est inférieur à 4 250 kg ?',
    questionEn: 'What category permits towing a trailer over 750 kg when combined weight is under 4,250 kg?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'ب', textFr: 'B', textEn: 'B' },
      { id: 'b', textAr: 'ب(هـ)', textFr: 'B(E)', textEn: 'B(E)' },
      { id: 'c', textAr: 'ج', textFr: 'C', textEn: 'C' },
      { id: 'd', textAr: 'د', textFr: 'D', textEn: 'D' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'الفئة ب(هـ) توسع تصريح الفئة ب ليشمل المقطورات التي تتجاوز 750 كغ، بحد أقصى مجمع بين 3,500 و 4,250 كغ.',
      fr: 'La catégorie B(E) étend l\'autorisation de la catégorie B pour inclure les remorques dépassant 750 kg, avec un poids combiné maximum entre 3 500 et 4 250 kg.',
      en: 'Category B(E) extends Category B authorization to include trailers exceeding 750 kg, with combined maximum between 3,500 and 4,250 kg.',
    },
    topic: 'vehicle-categories',
    difficulty: 'hard',
    points: 2,
  },
  {
    id: 'vc-005',
    questionAr: 'ما هو الحد الأدنى للسن المطلوب لرخصة الفئة ج (الشاحنات الثقيلة)؟',
    questionFr: 'Quel est l\'âge minimum requis pour le permis de catégorie C (camions lourds) ?',
    questionEn: 'What is the minimum age requirement for Category C (heavy truck) license?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '21 سنة', textFr: '21 ans', textEn: '21 years' },
      { id: 'b', textAr: '23 سنة', textFr: '23 ans', textEn: '23 years' },
      { id: 'c', textAr: '25 سنة', textFr: '25 ans', textEn: '25 years' },
      { id: 'd', textAr: '27 سنة', textFr: '27 ans', textEn: '27 years' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'الفئة ج تتطلب حداً أدنى للسن 25 سنة، مما يعكس الطبيعة المهنية ومسؤوليات تشغيل مركبات البضائع الثقيلة.',
      fr: 'La catégorie C exige un âge minimum de 25 ans, reflétant la nature professionnelle et les responsabilités liées à la conduite de véhicules de marchandises lourds.',
      en: 'Category C requires a minimum age of 25 years, reflecting the professional nature and responsibilities of heavy goods vehicle operation.',
    },
    topic: 'vehicle-categories',
    difficulty: 'medium',
    points: 1,
  },

  // ============================================================================
  // SAFETY EQUIPMENT (Questions 21-25)
  // ============================================================================
  {
    id: 'se-001',
    questionAr: 'هل ارتداء حزام الأمان إلزامي لركاب المقاعد الخلفية في الجزائر؟',
    questionFr: 'Le port de la ceinture de sécurité est-il obligatoire pour les passagers des sièges arrière en Algérie ?',
    questionEn: 'Is seatbelt use mandatory for rear-seat passengers in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'لا، المقاعد الأمامية فقط', textFr: 'Non, uniquement les sièges avant', textEn: 'No, only front seats' },
      { id: 'b', textAr: 'فقط على الطرق السريعة', textFr: 'Uniquement sur les autoroutes', textEn: 'Only on highways' },
      { id: 'c', textAr: 'نعم، لجميع الركاب', textFr: 'Oui, pour tous les passagers', textEn: 'Yes, for all passengers' },
      { id: 'd', textAr: 'فقط للركاب البالغين', textFr: 'Uniquement pour les passagers adultes', textEn: 'Only for adult passengers' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'ارتداء حزام الأمان إلزامي لجميع ركاب المركبة بما في ذلك ركاب المقاعد الخلفية في الجزائر.',
      fr: 'Le port de la ceinture de sécurité est obligatoire pour tous les occupants du véhicule, y compris les passagers des sièges arrière en Algérie.',
      en: 'Seatbelt use is mandatory for all vehicle occupants including rear-seat passengers in Algeria.',
    },
    topic: 'safety-equipment',
    difficulty: 'easy',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'se-002',
    questionAr: 'ما هو الحد الأدنى للسن للأطفال للسماح لهم بالجلوس في المقاعد الأمامية؟',
    questionFr: 'Quel est l\'âge minimum pour que les enfants soient autorisés à s\'asseoir sur les sièges avant ?',
    questionEn: 'What is the minimum age for children to be permitted to sit in front seats?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'أقل من 5 سنوات', textFr: 'Moins de 5 ans', textEn: 'Under 5 years' },
      { id: 'b', textAr: 'أقل من 10 سنوات', textFr: 'Moins de 10 ans', textEn: 'Under 10 years' },
      { id: 'c', textAr: 'أقل من 14 سنة', textFr: 'Moins de 14 ans', textEn: 'Under 14 years' },
      { id: 'd', textAr: 'أقل من 18 سنة', textFr: 'Moins de 18 ans', textEn: 'Under 18 years' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'يُحظر على الأطفال دون سن 10 سنوات الجلوس في المقاعد الأمامية في الجزائر.',
      fr: 'Les enfants de moins de 10 ans sont interdits d\'occuper les sièges avant en Algérie.',
      en: 'Children under 10 years of age are prohibited from occupying front seats in Algeria.',
    },
    topic: 'safety-equipment',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'se-003',
    questionAr: 'هل ارتداء الخوذة إلزامي لركاب الدراجات النارية في الجزائر؟',
    questionFr: 'Le port du casque est-il obligatoire pour les passagers de moto en Algérie ?',
    questionEn: 'Is helmet use mandatory for motorcycle passengers in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'لا، للسائق فقط', textFr: 'Non, uniquement pour le conducteur', textEn: 'No, only for the driver' },
      { id: 'b', textAr: 'نعم، للسائق والركاب', textFr: 'Oui, pour le conducteur et les passagers', textEn: 'Yes, for both driver and passengers' },
      { id: 'c', textAr: 'فقط على الطرق السريعة', textFr: 'Uniquement sur les autoroutes', textEn: 'Only on highways' },
      { id: 'd', textAr: 'فقط للمسافات القصيرة', textFr: 'Uniquement pour les courtes distances', textEn: 'Only for short distances' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'ارتداء الخوذة إلزامي لكل من السائقين والركاب على الدراجات النارية والدراجات البخارية في الجزائر.',
      fr: 'Le port du casque est obligatoire pour les conducteurs et les passagers de motos et de cyclomoteurs en Algérie.',
      en: 'Helmet use is mandatory for both drivers and passengers of motorcycles and mopeds in Algeria.',
    },
    topic: 'safety-equipment',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'se-004',
    questionAr: 'ما هي المعدات التي يجب أن تحملها المركبات لحالات الطوارئ في الجزائر؟',
    questionFr: 'Quels équipements les véhicules doivent-ils transporter pour les situations d\'urgence en Algérie ?',
    questionEn: 'What equipment must vehicles carry for emergency situations in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'مثلث تحذير فقط', textFr: 'Triangle de signalisation uniquement', textEn: 'Warning triangle only' },
      { id: 'b', textAr: 'سترة عاكسة فقط', textFr: 'Gilet réfléchissant uniquement', textEn: 'Reflective vest only' },
      { id: 'c', textAr: 'مثلث تحذير وسترة عاكسة', textFr: 'Triangle de signalisation et gilet réfléchissant', textEn: 'Both warning triangle and reflective vest' },
      { id: 'd', textAr: 'حقيبة إسعافات أولية وطفاية حريق', textFr: 'Trousse de premiers secours et extincteur', textEn: 'First-aid kit and fire extinguisher' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'يجب أن تحمل المركبات في الجزائر كلاً من مثلثات التحذير والسترات العاكسة للاستخدام في حالات الطوارئ.',
      fr: 'Les véhicules en Algérie doivent transporter à la fois des triangles de signalisation et des gilets réfléchissants pour une utilisation en cas d\'urgence.',
      en: 'Vehicles in Algeria must carry both warning triangles and reflective vests for use in emergency situations.',
    },
    topic: 'safety-equipment',
    difficulty: 'easy',
    points: 1,
  },
  {
    id: 'se-005',
    questionAr: 'ما هو تصنيف العقوبة لعدم ارتداء حزام الأمان كراكب في المركبة؟',
    questionFr: 'Quelle est la classification de la sanction pour ne pas porter la ceinture de sécurité en tant qu\'occupant du véhicule ?',
    questionEn: 'What is the classification penalty for not wearing a seatbelt as a vehicle occupant?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'مخالفة من الدرجة الرابعة', textFr: 'Contravention de quatrième degré', textEn: 'Fourth-degree contravention' },
      { id: 'b', textAr: 'مخالفة من الدرجة الثالثة', textFr: 'Contravention de troisième degré', textEn: 'Third-degree contravention' },
      { id: 'c', textAr: 'مخالفة من الدرجة الثانية', textFr: 'Contravention de deuxième degré', textEn: 'Second-degree contravention' },
      { id: 'd', textAr: 'مخالفة من الدرجة الأولى', textFr: 'Contravention de premier degré', textEn: 'First-degree contravention' },
    ],
    correctAnswerId: 'd',
    explanation: {
      ar: 'عدم ارتداء حزام الأمان كراكب في المركبة يصنف كمخالفة من الدرجة الأولى، بغرامة 2,000 دينار.',
      fr: 'Le non-port de la ceinture de sécurité en tant qu\'occupant du véhicule est classé comme une contravention de premier degré, avec une amende de 2 000 dinars.',
      en: 'Failure to wear a seatbelt as a vehicle occupant is classified as a first-degree contravention, carrying a 2,000 dinar fine.',
    },
    topic: 'safety-equipment',
    difficulty: 'medium',
    lawReference: 'Law 17-05',
    points: 1,
  },

  // ============================================================================
  // POINT SYSTEM (Questions 26-32)
  // ============================================================================
  {
    id: 'ps-001',
    questionAr: 'ما هو الحد الأقصى لرصيد النقاط لرخصة القيادة المتوافقة بالكامل في الجزائر؟',
    questionFr: 'Quel est le solde maximal de points pour un permis de conduire entièrement conforme en Algérie ?',
    questionEn: 'What is the maximum point balance for a fully compliant driving permit in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '12 نقطة', textFr: '12 points', textEn: '12 points' },
      { id: 'b', textAr: '18 نقطة', textFr: '18 points', textEn: '18 points' },
      { id: 'c', textAr: '24 نقطة', textFr: '24 points', textEn: '24 points' },
      { id: 'd', textAr: '30 نقطة', textFr: '30 points', textEn: '30 points' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'رأس مال النقاط النهائي لرخصة القيادة الجزائرية المتوافقة بالكامل هو 24 نقطة.',
      fr: 'Le capital de points définitif pour un permis de conduire algérien entièrement conforme est de 24 points.',
      en: 'The definitive point capital for a fully compliant Algerian driving permit is 24 points.',
    },
    topic: 'point-system',
    difficulty: 'easy',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-002',
    questionAr: 'ما هو رصيد النقاط الأولي للسائق الجديد خلال فترة الاختبار؟',
    questionFr: 'Quel est le solde de points initial pour un nouveau conducteur pendant la période probatoire ?',
    questionEn: 'What is the initial point balance for a new driver during the probationary period?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '6 نقاط', textFr: '6 points', textEn: '6 points' },
      { id: 'b', textAr: '12 نقطة', textFr: '12 points', textEn: '12 points' },
      { id: 'c', textAr: '18 نقطة', textFr: '18 points', textEn: '18 points' },
      { id: 'd', textAr: '24 نقطة', textFr: '24 points', textEn: '24 points' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'يبدأ السائقون الجدد بـ 12 نقطة خلال فترة الاختبار لمدة سنتين، مخفضة من رأس المال الكامل البالغ 24 نقطة.',
      fr: 'Les nouveaux conducteurs commencent avec 12 points pendant leur période probatoire de deux ans, réduit du capital complet de 24 points.',
      en: 'New drivers start with 12 points during their two-year probationary period, reduced from the full 24-point capital.',
    },
    topic: 'point-system',
    difficulty: 'easy',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-003',
    questionAr: 'ماذا يحدث عندما يفقد حامل الرخصة جميع النقاط؟',
    questionFr: 'Que se passe-t-il lorsqu\'un titulaire de permis perd tous ses points ?',
    questionEn: 'What happens when a permit holder loses all points?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'رسالة تحذير', textFr: 'Lettre d\'avertissement', textEn: 'Warning letter' },
      { id: 'b', textAr: 'إبطال تلقائي للرخصة', textFr: 'Invalidation automatique du permis', textEn: 'Automatic permit invalidation' },
      { id: 'c', textAr: 'غرامة فقط', textFr: 'Amende uniquement', textEn: 'Fine only' },
      { id: 'd', textAr: 'تعليق قصير', textFr: 'Courte suspension', textEn: 'Short suspension' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'عندما تصل الرخصة إلى صفر نقطة، يتم إبطالها تلقائياً. يجب على الحامل تسليم الرخصة والانتظار ستة أشهر (سنة للإبطال المتكرر خلال خمس سنوات) قبل التقدم لرخصة جديدة.',
      fr: 'Lorsqu\'un permis atteint zéro point, il est automatiquement invalidé. Le titulaire doit remettre le permis et attendre six mois (un an pour une invalidation répétée dans les cinq ans) avant de demander un nouveau permis.',
      en: 'When a permit reaches zero points, it is automatically invalidated. The holder must surrender the permit and wait six months (one year for repeat invalidation within five years) before applying for a new permit.',
    },
    topic: 'point-system',
    difficulty: 'medium',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-004',
    questionAr: 'ما هي مدة فترة الاختبار لحاملي الرخص الجدد في الجزائر؟',
    questionFr: 'Quelle est la durée de la période probatoire pour les nouveaux titulaires de permis en Algérie ?',
    questionEn: 'How long is the probationary period for new license holders in Algeria?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'سنة واحدة', textFr: '1 an', textEn: '1 year' },
      { id: 'b', textAr: 'سنتان', textFr: '2 ans', textEn: '2 years' },
      { id: 'c', textAr: '3 سنوات', textFr: '3 ans', textEn: '3 years' },
      { id: 'd', textAr: '5 سنوات', textFr: '5 ans', textEn: '5 years' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'فترة الاختبار لحاملي الرخص الجدد في الجزائر هي سنتان، يكون خلالها رأس مال النقاط مخفضاً ويواجهون عقوبات أشد على المخالفات.',
      fr: 'La période probatoire pour les nouveaux titulaires de permis en Algérie est de deux ans, pendant laquelle ils ont un capital de points réduit et font face à des sanctions plus strictes pour les infractions.',
      en: 'The probationary period for new license holders in Algeria is two years, during which they have reduced point capital and face stricter penalties for violations.',
    },
    topic: 'point-system',
    difficulty: 'easy',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-005',
    questionAr: 'كم عدد النقاط المفقودة لمخالفة من الدرجة الرابعة؟',
    questionFr: 'Combien de points sont perdus pour une contravention de quatrième degré ?',
    questionEn: 'How many points are lost for a fourth-degree contravention?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: '2 نقطة', textFr: '2 points', textEn: '2 points' },
      { id: 'b', textAr: '4 نقاط', textFr: '4 points', textEn: '4 points' },
      { id: 'c', textAr: '6 نقاط', textFr: '6 points', textEn: '6 points' },
      { id: 'd', textAr: '10 نقاط', textFr: '10 points', textEn: '10 points' },
    ],
    correctAnswerId: 'c',
    explanation: {
      ar: 'مخالفات الدرجة الرابعة تؤدي إلى خسارة ست نقاط من رصيد الرخصة.',
      fr: 'Les contraventions de quatrième degré entraînent une perte de six points du solde du permis.',
      en: 'Fourth-degree contraventions result in six-point loss from the permit balance.',
    },
    topic: 'point-system',
    difficulty: 'medium',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-006',
    questionAr: 'هل يمكن استرداد النقاط من خلال إكمال دورة تدريبية؟',
    questionFr: 'Les points peuvent-ils être récupérés en suivant une formation ?',
    questionEn: 'Can points be recovered through completing a training course?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'لا، فقط من خلال فترة خالية من المخالفات', textFr: 'Non, uniquement par une période sans infraction', textEn: 'No, only through violation-free period' },
      { id: 'b', textAr: 'نعم، على نفقة السائق', textFr: 'Oui, aux frais du conducteur', textEn: 'Yes, at the driver\'s expense' },
      { id: 'c', textAr: 'نعم، لكن فقط للسائقين في فترة الاختبار', textFr: 'Oui, mais uniquement pour les conducteurs probatoires', textEn: 'Yes, but only for probationary drivers' },
      { id: 'd', textAr: 'لا، لا يمكن استرداد النقاط أبداً', textFr: 'Non, les points ne peuvent jamais être récupérés', textEn: 'No, points can never be recovered' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'يمكن استرداد النقاط إما من خلال فترة خالية من المخالفات أو من خلال إكمال دورة تدريبية معتمدة على نفقة السائق.',
      fr: 'Les points peuvent être récupérés soit par une période sans infraction, soit en suivant une formation autorisée aux frais du conducteur.',
      en: 'Points can be recovered either through a violation-free period or by completing an authorized training course at the driver\'s expense.',
    },
    topic: 'point-system',
    difficulty: 'medium',
    lawReference: 'Law 17-05',
    points: 1,
  },
  {
    id: 'ps-007',
    questionAr: 'ما هو الحد الأقصى لخسارة النقاط للمخالفات المتزامنة المتعددة؟',
    questionFr: 'Quelle est la perte maximale de points pour plusieurs infractions simultanées ?',
    questionEn: 'What is the maximum point loss for multiple simultaneous violations?',
    type: 'multiple-choice',
    options: [
      { id: 'a', textAr: 'جميع النقاط المتبقية', textFr: 'Tous les points restants', textEn: 'All remaining points' },
      { id: 'b', textAr: 'نصف رأس المال النهائي', textFr: 'La moitié du capital définitif', textEn: 'Half the definitive capital' },
      { id: 'c', textAr: 'أعلى مخالفة فردية', textFr: 'L\'infraction individuelle la plus élevée', textEn: 'The highest single violation' },
      { id: 'd', textAr: 'ثلاثة أضعاف أعلى مخالفة', textFr: 'Le triple de l\'infraction la plus élevée', textEn: 'Triple the highest violation' },
    ],
    correctAnswerId: 'b',
    explanation: {
      ar: 'خسائر النقاط للمخالفات المتزامنة تتراكم، لكن فقط حتى حد أقصى نصف رأس مال النقاط النهائي (12 نقطة من أصل 24 كاملة).',
      fr: 'Les pertes de points pour les infractions simultanées s\'accumulent, mais uniquement jusqu\'à un maximum de la moitié du capital de points définitif (12 points sur les 24 complets).',
      en: 'Point losses for simultaneous violations accumulate, but only up to a maximum of half the definitive point capital (12 points from the full 24).',
    },
    topic: 'point-system',
    difficulty: 'hard',
    lawReference: 'Law 17-05',
    points: 2,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQuestionsByTopic(topic: string): AlgeriaQuizQuestion[] {
  return ALGERIA_QUIZ_QUESTIONS.filter(q => q.topic === topic);
}

export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): AlgeriaQuizQuestion[] {
  return ALGERIA_QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty);
}

export function getRandomQuestions(count: number, options?: {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}): AlgeriaQuizQuestion[] {
  let questions = [...ALGERIA_QUIZ_QUESTIONS];
  
  if (options?.topic) {
    questions = questions.filter(q => q.topic === options.topic);
  }
  
  if (options?.difficulty) {
    questions = questions.filter(q => q.difficulty === options.difficulty);
  }
  
  // Fisher-Yates shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  
  return questions.slice(0, count);
}

export function calculateQuizScore(
  answers: Record<string, string>,
  questions: AlgeriaQuizQuestion[]
): { score: number; totalPoints: number; percentage: number } {
  let score = 0;
  let totalPoints = 0;
  
  for (const question of questions) {
    totalPoints += question.points;
    if (answers[question.id] === question.correctAnswerId) {
      score += question.points;
    }
  }
  
  return {
    score,
    totalPoints,
    percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
  };
}

// Official exam passing threshold (commonly 25/30 or ~83%)
export const PASSING_PERCENTAGE = 83;

export function isPassing(percentage: number): boolean {
  return percentage >= PASSING_PERCENTAGE;
}
