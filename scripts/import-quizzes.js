/**
 * Algerian Driving Theory Quiz Bank Import Script
 * Imports comprehensive quiz questions covering all aspects of Algerian traffic code
 * 
 * Usage: node scripts/import-quizzes.js
 * 
 * Prerequisites:
 * - Firebase service account JSON file at ./firebase-service-account.json
 * - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Failed to load service account. Make sure firebase-service-account.json exists.');
  console.error('   You can download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();
const COLLECTIONS = {
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
};

// ============================================================================
// QUIZ BANK DATA
// ============================================================================

const QUIZ_BANK = [
  // Quiz 1: Traffic Rules Basics
  {
    title: {
      en: "Traffic Rules Basics",
      fr: "Code de la Route - Règles de Base",
      ar: "قواعد المرور الأساسية"
    },
    description: {
      en: "Fundamental traffic rules and regulations in Algeria. Essential for theory exam preparation.",
      fr: "Règles fondamentales de circulation en Algérie. Essentiel pour la préparation à l'examen théorique.",
      ar: "القواعد الأساسية للمرور في الجزائر. ضروري للتحضير للامتحان النظري."
    },
    category: "traffic-rules",
    passingScore: 70,
    timeLimit: 30,
    isPublished: true,
    questions: [
      {
        question: {
          en: "What is the maximum speed limit in urban areas in Algeria?",
          fr: "Quelle est la limite de vitesse maximale en zone urbaine en Algérie?",
          ar: "ما هي السرعة القصوى المسموح بها في المناطق الحضرية في الجزائر؟"
        },
        options: {
          en: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
          fr: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
          ar: ["40 كم/س", "50 كم/س", "60 كم/س", "70 كم/س"]
        },
        correctAnswer: 1,
        explanation: {
          en: "According to Algerian traffic law, the maximum speed limit in urban areas is 50 km/h unless otherwise indicated.",
          fr: "Selon le code de la route algérien, la vitesse maximale en zone urbaine est de 50 km/h sauf indication contraire.",
          ar: "وفقًا لقانون المرور الجزائري، الحد الأقصى للسرعة في المناطق الحضرية هو 50 كم/س ما لم يُذكر خلاف ذلك."
        },
        category: "speed-limits",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a solid white line on the road mean?",
          fr: "Que signifie une ligne blanche continue sur la route?",
          ar: "ماذا يعني الخط الأبيض المتصل على الطريق؟"
        },
        options: {
          en: ["You can cross it anytime", "You cannot cross it under any circumstances", "You can cross it only when turning", "It's just for decoration"],
          fr: ["Vous pouvez la franchir à tout moment", "Vous ne pouvez pas la franchir en aucune circonstance", "Vous pouvez la franchir uniquement pour tourner", "C'est juste décoratif"],
          ar: ["يمكنك عبوره في أي وقت", "لا يمكنك عبوره تحت أي ظرف", "يمكنك عبوره فقط عند الانعطاف", "إنه للزينة فقط"]
        },
        correctAnswer: 1,
        explanation: {
          en: "A solid white line indicates that crossing is prohibited. This is a fundamental road marking rule.",
          fr: "Une ligne blanche continue indique que le franchissement est interdit. C'est une règle fondamentale de marquage routier.",
          ar: "يشير الخط الأبيض المتصل إلى أن العبور محظور. هذه قاعدة أساسية لعلامات الطريق."
        },
        category: "traffic-rules",
        difficulty: "easy"
      },
      {
        question: {
          en: "At a roundabout, who has priority?",
          fr: "Dans un rond-point, qui a la priorité?",
          ar: "في الدوار، من له الأولوية؟"
        },
        options: {
          en: ["Vehicles entering the roundabout", "Vehicles already in the roundabout", "Larger vehicles", "Whoever arrives first"],
          fr: ["Les véhicules entrant dans le rond-point", "Les véhicules déjà dans le rond-point", "Les véhicules plus grands", "Celui qui arrive en premier"],
          ar: ["المركبات التي تدخل الدوار", "المركبات الموجودة بالفعل في الدوار", "المركبات الأكبر", "من يصل أولاً"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Vehicles already circulating in the roundabout have priority over vehicles entering.",
          fr: "Les véhicules circulant déjà dans le rond-point ont priorité sur les véhicules entrants.",
          ar: "المركبات التي تسير بالفعل في الدوار لها الأولوية على المركبات الداخلة."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "What is the minimum legal age to obtain a category B driving license in Algeria?",
          fr: "Quel est l'âge minimum légal pour obtenir un permis de conduire catégorie B en Algérie?",
          ar: "ما هو الحد الأدنى للسن القانوني للحصول على رخصة قيادة فئة ب في الجزائر؟"
        },
        options: {
          en: ["16 years", "17 years", "18 years", "21 years"],
          fr: ["16 ans", "17 ans", "18 ans", "21 ans"],
          ar: ["16 سنة", "17 سنة", "18 سنة", "21 سنة"]
        },
        correctAnswer: 2,
        explanation: {
          en: "According to Algerian law, you must be at least 18 years old to obtain a category B (car) driving license.",
          fr: "Selon la loi algérienne, vous devez avoir au moins 18 ans pour obtenir un permis de conduire catégorie B (voiture).",
          ar: "وفقًا للقانون الجزائري، يجب أن يكون عمرك 18 عامًا على الأقل للحصول على رخصة قيادة فئة ب (سيارة)."
        },
        category: "general-knowledge",
        difficulty: "easy"
      },
      {
        question: {
          en: "When must you use your headlights?",
          fr: "Quand devez-vous utiliser vos phares?",
          ar: "متى يجب استخدام المصابيح الأمامية؟"
        },
        options: {
          en: ["Only at night", "Only in tunnels", "At night, in tunnels, and in poor visibility", "Never during the day"],
          fr: ["Uniquement la nuit", "Uniquement dans les tunnels", "La nuit, dans les tunnels et par mauvaise visibilité", "Jamais pendant la journée"],
          ar: ["في الليل فقط", "في الأنفاق فقط", "في الليل والأنفاق وعند ضعف الرؤية", "أبداً أثناء النهار"]
        },
        correctAnswer: 2,
        explanation: {
          en: "Headlights must be used at night, in tunnels, and whenever visibility is reduced (fog, heavy rain, etc.).",
          fr: "Les phares doivent être utilisés la nuit, dans les tunnels et chaque fois que la visibilité est réduite.",
          ar: "يجب استخدام المصابيح الأمامية في الليل والأنفاق وعندما تكون الرؤية ضعيفة."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What is the blood alcohol limit for drivers in Algeria?",
          fr: "Quelle est la limite d'alcoolémie pour les conducteurs en Algérie?",
          ar: "ما هو الحد المسموح به للكحول في الدم للسائقين في الجزائر؟"
        },
        options: {
          en: ["0.00 g/L (zero tolerance)", "0.02 g/L", "0.05 g/L", "0.08 g/L"],
          fr: ["0,00 g/L (tolérance zéro)", "0,02 g/L", "0,05 g/L", "0,08 g/L"],
          ar: ["0.00 غ/ل (تسامح صفري)", "0.02 غ/ل", "0.05 غ/ل", "0.08 غ/ل"]
        },
        correctAnswer: 0,
        explanation: {
          en: "Algeria has a zero-tolerance policy for alcohol and driving. The limit is 0.00 g/L.",
          fr: "L'Algérie a une politique de tolérance zéro pour l'alcool au volant. La limite est de 0,00 g/L.",
          ar: "الجزائر لديها سياسة عدم التسامح مع الكحول والقيادة. الحد هو 0.00 غ/ل."
        },
        category: "traffic-rules",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do when an ambulance with sirens approaches from behind?",
          fr: "Que devez-vous faire lorsqu'une ambulance avec sirènes approche par derrière?",
          ar: "ماذا يجب أن تفعل عندما تقترب سيارة إسعاف بصفاراتها من الخلف؟"
        },
        options: {
          en: ["Speed up to get out of the way", "Stop immediately where you are", "Pull over to the right and stop", "Continue at the same speed"],
          fr: ["Accélérer pour dégager la voie", "S'arrêter immédiatement sur place", "Se ranger à droite et s'arrêter", "Continuer à la même vitesse"],
          ar: ["سرّع للخروج من الطريق", "توقف فوراً في مكانك", "انحرف إلى اليمين وتوقف", "استمر بنفس السرعة"]
        },
        correctAnswer: 2,
        explanation: {
          en: "You must pull over to the right side of the road and stop to allow emergency vehicles to pass.",
          fr: "Vous devez vous ranger sur le côté droit de la route et vous arrêter pour laisser passer les véhicules d'urgence.",
          ar: "يجب أن تنحرف إلى الجانب الأيمن من الطريق وتتوقف للسماح لمركبات الطوارئ بالمرور."
        },
        category: "emergency-procedures",
        difficulty: "easy"
      },
      {
        question: {
          en: "How far before a turn should you signal?",
          fr: "À quelle distance avant un virage devez-vous signaler?",
          ar: "على أي مسافة قبل الانعطاف يجب أن تشير؟"
        },
        options: {
          en: ["Just before turning", "About 50 meters before", "About 100 meters before", "No need to signal"],
          fr: ["Juste avant de tourner", "Environ 50 mètres avant", "Environ 100 mètres avant", "Pas besoin de signaler"],
          ar: ["قبل الانعطاف مباشرة", "حوالي 50 متر قبل", "حوالي 100 متر قبل", "لا حاجة للإشارة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "You should signal approximately 50 meters before making a turn to give other drivers adequate warning.",
          fr: "Vous devez signaler environ 50 mètres avant de tourner pour avertir les autres conducteurs.",
          ar: "يجب أن تشير قبل حوالي 50 متر من الانعطاف لإعطاء السائقين الآخرين تحذيرًا كافيًا."
        },
        category: "traffic-rules",
        difficulty: "easy"
      },
      {
        question: {
          en: "What is the maximum speed on Algerian highways (autoroutes)?",
          fr: "Quelle est la vitesse maximale sur les autoroutes algériennes?",
          ar: "ما هي السرعة القصوى على الطرق السريعة الجزائرية؟"
        },
        options: {
          en: ["100 km/h", "110 km/h", "120 km/h", "140 km/h"],
          fr: ["100 km/h", "110 km/h", "120 km/h", "140 km/h"],
          ar: ["100 كم/س", "110 كم/س", "120 كم/س", "140 كم/س"]
        },
        correctAnswer: 2,
        explanation: {
          en: "The maximum speed limit on Algerian highways (autoroutes) is 120 km/h unless otherwise posted.",
          fr: "La vitesse maximale sur les autoroutes algériennes est de 120 km/h sauf indication contraire.",
          ar: "الحد الأقصى للسرعة على الطرق السريعة الجزائرية هو 120 كم/س ما لم يُذكر خلاف ذلك."
        },
        category: "speed-limits",
        difficulty: "easy"
      },
      {
        question: {
          en: "When is it mandatory to wear a seatbelt?",
          fr: "Quand le port de la ceinture de sécurité est-il obligatoire?",
          ar: "متى يكون ارتداء حزام الأمان إلزامياً؟"
        },
        options: {
          en: ["Only on highways", "Only in the front seats", "Always, in all seats equipped with seatbelts", "Only when police are present"],
          fr: ["Uniquement sur autoroute", "Uniquement aux places avant", "Toujours, à toutes les places équipées de ceintures", "Uniquement en présence de la police"],
          ar: ["على الطرق السريعة فقط", "في المقاعد الأمامية فقط", "دائماً، في جميع المقاعد المجهزة بأحزمة", "فقط عند وجود الشرطة"]
        },
        correctAnswer: 2,
        explanation: {
          en: "Wearing seatbelts is mandatory for all occupants in all seats equipped with them, at all times.",
          fr: "Le port de la ceinture est obligatoire pour tous les occupants à toutes les places équipées, en tout temps.",
          ar: "ارتداء حزام الأمان إلزامي لجميع الركاب في جميع المقاعد المجهزة، في جميع الأوقات."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      }
    ]
  },

  // Quiz 2: Road Signs Recognition
  {
    title: {
      en: "Road Signs Recognition",
      fr: "Reconnaissance des Panneaux Routiers",
      ar: "التعرف على إشارات المرور"
    },
    description: {
      en: "Learn to identify and understand all categories of Algerian road signs.",
      fr: "Apprenez à identifier et comprendre toutes les catégories de panneaux routiers algériens.",
      ar: "تعلم التعرف على جميع فئات إشارات المرور الجزائرية وفهمها."
    },
    category: "road-signs",
    passingScore: 70,
    timeLimit: 30,
    isPublished: true,
    questions: [
      {
        question: {
          en: "What shape is a STOP sign?",
          fr: "Quelle est la forme d'un panneau STOP?",
          ar: "ما هو شكل إشارة قف؟"
        },
        options: {
          en: ["Circle", "Triangle", "Octagon (8 sides)", "Rectangle"],
          fr: ["Cercle", "Triangle", "Octogone (8 côtés)", "Rectangle"],
          ar: ["دائرة", "مثلث", "مثمن (8 أضلاع)", "مستطيل"]
        },
        correctAnswer: 2,
        explanation: {
          en: "A STOP sign is octagonal (8-sided) with white text 'STOP' on a red background - unique worldwide.",
          fr: "Un panneau STOP est octogonal (8 côtés) avec le texte blanc 'STOP' sur fond rouge - unique au monde.",
          ar: "إشارة قف مثمنة (8 أضلاع) مع نص أبيض 'STOP' على خلفية حمراء - فريدة عالمياً."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What color are prohibition signs?",
          fr: "De quelle couleur sont les panneaux d'interdiction?",
          ar: "ما هو لون إشارات المنع؟"
        },
        options: {
          en: ["Blue", "Red", "Yellow", "Green"],
          fr: ["Bleu", "Rouge", "Jaune", "Vert"],
          ar: ["أزرق", "أحمر", "أصفر", "أخضر"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Prohibition signs are circular with a red border, indicating what is not allowed.",
          fr: "Les panneaux d'interdiction sont circulaires avec un bord rouge, indiquant ce qui n'est pas autorisé.",
          ar: "إشارات المنع دائرية مع حدود حمراء، تشير إلى ما هو غير مسموح."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "A triangular sign with a red border indicates:",
          fr: "Un panneau triangulaire avec un bord rouge indique:",
          ar: "إشارة مثلثة بحدود حمراء تشير إلى:"
        },
        options: {
          en: ["Prohibition", "Warning/Danger", "Mandatory action", "Information"],
          fr: ["Interdiction", "Avertissement/Danger", "Action obligatoire", "Information"],
          ar: ["منع", "تحذير/خطر", "إجراء إلزامي", "معلومات"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Red-bordered triangular signs are warning signs, alerting you to dangers ahead.",
          fr: "Les panneaux triangulaires à bord rouge sont des panneaux d'avertissement, vous alertant des dangers à venir.",
          ar: "الإشارات المثلثة ذات الحدود الحمراء هي إشارات تحذير، تنبهك للأخطار القادمة."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a blue circular sign indicate?",
          fr: "Qu'indique un panneau circulaire bleu?",
          ar: "ماذا تشير الإشارة الدائرية الزرقاء؟"
        },
        options: {
          en: ["Prohibition", "Warning", "Mandatory instruction", "Parking"],
          fr: ["Interdiction", "Avertissement", "Instruction obligatoire", "Stationnement"],
          ar: ["منع", "تحذير", "تعليمات إلزامية", "موقف سيارات"]
        },
        correctAnswer: 2,
        explanation: {
          en: "Blue circular signs give mandatory instructions that must be followed.",
          fr: "Les panneaux circulaires bleus donnent des instructions obligatoires à suivre.",
          ar: "الإشارات الدائرية الزرقاء تعطي تعليمات إلزامية يجب اتباعها."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a sign with a red diagonal line across it mean?",
          fr: "Que signifie un panneau avec une ligne diagonale rouge?",
          ar: "ماذا تعني إشارة بها خط قطري أحمر؟"
        },
        options: {
          en: ["Start of restriction", "End of restriction", "Parking allowed", "Speed limit"],
          fr: ["Début de restriction", "Fin de restriction", "Stationnement autorisé", "Limite de vitesse"],
          ar: ["بداية القيد", "نهاية القيد", "الوقوف مسموح", "حد السرعة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "A red diagonal line through a sign indicates the end of the previous restriction.",
          fr: "Une ligne diagonale rouge à travers un panneau indique la fin de la restriction précédente.",
          ar: "خط قطري أحمر عبر الإشارة يشير إلى نهاية القيد السابق."
        },
        category: "road-signs",
        difficulty: "medium"
      },
      {
        question: {
          en: "What does a rectangular blue sign with white symbols indicate?",
          fr: "Qu'indique un panneau rectangulaire bleu avec des symboles blancs?",
          ar: "ماذا تشير الإشارة المستطيلة الزرقاء برموز بيضاء؟"
        },
        options: {
          en: ["Warning", "Prohibition", "Information/Direction", "Danger"],
          fr: ["Avertissement", "Interdiction", "Information/Direction", "Danger"],
          ar: ["تحذير", "منع", "معلومات/اتجاه", "خطر"]
        },
        correctAnswer: 2,
        explanation: {
          en: "Rectangular blue signs provide information about directions, services, or facilities.",
          fr: "Les panneaux rectangulaires bleus fournissent des informations sur les directions, services ou installations.",
          ar: "الإشارات المستطيلة الزرقاء توفر معلومات عن الاتجاهات والخدمات والمرافق."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a sign showing two cars side by side (one red, one black) mean?",
          fr: "Que signifie un panneau montrant deux voitures côte à côte (une rouge, une noire)?",
          ar: "ماذا تعني إشارة تظهر سيارتين جنباً إلى جنب (واحدة حمراء وواحدة سوداء)؟"
        },
        options: {
          en: ["Parking for two cars", "No overtaking", "Two-way traffic", "Car racing allowed"],
          fr: ["Stationnement pour deux voitures", "Dépassement interdit", "Circulation à double sens", "Course automobile autorisée"],
          ar: ["موقف لسيارتين", "ممنوع التجاوز", "حركة مرور باتجاهين", "سباق السيارات مسموح"]
        },
        correctAnswer: 1,
        explanation: {
          en: "This sign prohibits overtaking/passing other vehicles.",
          fr: "Ce panneau interdit le dépassement d'autres véhicules.",
          ar: "هذه الإشارة تمنع تجاوز المركبات الأخرى."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a circular sign with a red border showing '50' mean?",
          fr: "Que signifie un panneau circulaire avec un bord rouge montrant '50'?",
          ar: "ماذا تعني إشارة دائرية بحدود حمراء تظهر '50'؟"
        },
        options: {
          en: ["Minimum speed 50 km/h", "Maximum speed 50 km/h", "50 meters to next exit", "50% discount on tolls"],
          fr: ["Vitesse minimale 50 km/h", "Vitesse maximale 50 km/h", "50 mètres jusqu'à la sortie", "Réduction de 50% sur les péages"],
          ar: ["الحد الأدنى للسرعة 50 كم/س", "الحد الأقصى للسرعة 50 كم/س", "50 متر للمخرج التالي", "خصم 50% على الرسوم"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Numbers in a red circle indicate maximum speed limits in km/h.",
          fr: "Les chiffres dans un cercle rouge indiquent les limites de vitesse maximale en km/h.",
          ar: "الأرقام في دائرة حمراء تشير إلى الحد الأقصى للسرعة بالكيلومتر/ساعة."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "A sign showing a black curved arrow on white background in red triangle means:",
          fr: "Un panneau montrant une flèche noire courbe sur fond blanc dans un triangle rouge signifie:",
          ar: "إشارة تظهر سهماً أسود منحنياً على خلفية بيضاء في مثلث أحمر تعني:"
        },
        options: {
          en: ["Roundabout ahead", "Dangerous curve ahead", "U-turn allowed", "Winding road"],
          fr: ["Rond-point devant", "Virage dangereux devant", "Demi-tour autorisé", "Route sinueuse"],
          ar: ["دوار قادم", "منحنى خطير قادم", "الدوران مسموح", "طريق متعرج"]
        },
        correctAnswer: 1,
        explanation: {
          en: "A curved arrow in a warning triangle indicates a dangerous curve ahead - reduce speed.",
          fr: "Une flèche courbe dans un triangle d'avertissement indique un virage dangereux - réduisez la vitesse.",
          ar: "سهم منحنٍ في مثلث تحذيري يشير إلى منحنى خطير قادم - قلل السرعة."
        },
        category: "road-signs",
        difficulty: "easy"
      },
      {
        question: {
          en: "What does a sign with 'P' and a red diagonal line mean?",
          fr: "Que signifie un panneau avec 'P' et une ligne diagonale rouge?",
          ar: "ماذا تعني إشارة بها 'P' وخط قطري أحمر؟"
        },
        options: {
          en: ["Parking allowed", "No parking", "Paid parking", "Park and ride"],
          fr: ["Stationnement autorisé", "Stationnement interdit", "Stationnement payant", "Parc relais"],
          ar: ["الوقوف مسموح", "ممنوع الوقوف", "وقوف مدفوع", "موقف وانتقال"]
        },
        correctAnswer: 1,
        explanation: {
          en: "A 'P' with a red diagonal line or red border means no parking is allowed.",
          fr: "Un 'P' avec une ligne diagonale rouge ou un bord rouge signifie que le stationnement est interdit.",
          ar: "'P' مع خط قطري أحمر أو حدود حمراء يعني ممنوع الوقوف."
        },
        category: "road-signs",
        difficulty: "easy"
      }
    ]
  },

  // Quiz 3: Priority and Right of Way
  {
    title: {
      en: "Priority and Right of Way",
      fr: "Priorité et Droit de Passage",
      ar: "الأولوية وحق المرور"
    },
    description: {
      en: "Master the rules of priority at intersections, roundabouts, and special situations.",
      fr: "Maîtrisez les règles de priorité aux intersections, ronds-points et situations spéciales.",
      ar: "أتقن قواعد الأولوية في التقاطعات والدوارات والمواقف الخاصة."
    },
    category: "right-of-way",
    passingScore: 70,
    timeLimit: 30,
    isPublished: true,
    questions: [
      {
        question: {
          en: "Who has priority at an intersection where both roads are equal?",
          fr: "Qui a la priorité à une intersection où les deux routes sont égales?",
          ar: "من له الأولوية في تقاطع حيث الطريقان متساويان؟"
        },
        options: {
          en: ["The vehicle on the left", "The vehicle on the right", "The larger vehicle", "Whoever honks first"],
          fr: ["Le véhicule de gauche", "Le véhicule de droite", "Le véhicule le plus grand", "Celui qui klaxonne en premier"],
          ar: ["المركبة على اليسار", "المركبة على اليمين", "المركبة الأكبر", "من يزمر أولاً"]
        },
        correctAnswer: 1,
        explanation: {
          en: "In Algeria, when two roads are equal, priority goes to the vehicle approaching from the right (priorité à droite).",
          fr: "En Algérie, lorsque deux routes sont égales, la priorité va au véhicule venant de droite (priorité à droite).",
          ar: "في الجزائر، عندما يكون الطريقان متساويين، الأولوية للمركبة القادمة من اليمين."
        },
        category: "right-of-way",
        difficulty: "medium"
      },
      {
        question: {
          en: "At a T-intersection, who has priority?",
          fr: "À une intersection en T, qui a la priorité?",
          ar: "في تقاطع على شكل T، من له الأولوية؟"
        },
        options: {
          en: ["Vehicles on the continuous road", "Vehicles on the joining road", "Both have equal priority", "Whoever arrives first"],
          fr: ["Véhicules sur la route continue", "Véhicules sur la route rejoignant", "Les deux ont une priorité égale", "Celui qui arrive en premier"],
          ar: ["المركبات على الطريق المستمر", "المركبات على الطريق المنضم", "كلاهما لهما أولوية متساوية", "من يصل أولاً"]
        },
        correctAnswer: 0,
        explanation: {
          en: "At a T-intersection, vehicles on the continuous (through) road have priority over vehicles entering from the side road.",
          fr: "À une intersection en T, les véhicules sur la route continue ont priorité sur ceux entrant par la route latérale.",
          ar: "في تقاطع على شكل T، المركبات على الطريق المستمر لها الأولوية على المركبات الداخلة من الطريق الجانبي."
        },
        category: "right-of-way",
        difficulty: "medium"
      },
      {
        question: {
          en: "What does a yellow diamond sign indicate?",
          fr: "Qu'indique un panneau en losange jaune?",
          ar: "ماذا تشير إشارة المعين الأصفر؟"
        },
        options: {
          en: ["Warning of danger", "You have priority road", "Yield to others", "School zone"],
          fr: ["Avertissement de danger", "Vous êtes sur une route prioritaire", "Cédez le passage", "Zone scolaire"],
          ar: ["تحذير من خطر", "أنت على طريق ذي أولوية", "أفسح المجال للآخرين", "منطقة مدرسية"]
        },
        correctAnswer: 1,
        explanation: {
          en: "A yellow diamond sign indicates you are on a priority road and have right of way.",
          fr: "Un panneau en losange jaune indique que vous êtes sur une route prioritaire et avez la priorité.",
          ar: "إشارة المعين الأصفر تشير إلى أنك على طريق ذي أولوية ولك حق المرور."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "At a crosswalk with no traffic signal, who has priority?",
          fr: "À un passage piéton sans feu de circulation, qui a la priorité?",
          ar: "عند ممر المشاة بدون إشارة مرور، من له الأولوية؟"
        },
        options: {
          en: ["Vehicles always", "Pedestrians always", "Whoever arrives first", "Larger groups"],
          fr: ["Véhicules toujours", "Piétons toujours", "Celui qui arrive en premier", "Groupes plus grands"],
          ar: ["المركبات دائماً", "المشاة دائماً", "من يصل أولاً", "المجموعات الأكبر"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Pedestrians always have absolute priority at marked crosswalks, whether signaled or not.",
          fr: "Les piétons ont toujours la priorité absolue aux passages piétons, qu'ils soient signalés ou non.",
          ar: "المشاة لهم الأولوية المطلقة دائماً عند ممرات المشاة، سواء كانت بإشارات أم لا."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do when approaching a YIELD sign?",
          fr: "Que devez-vous faire en approchant d'un panneau CÉDEZ LE PASSAGE?",
          ar: "ماذا يجب أن تفعل عند الاقتراب من إشارة أفسح المجال؟"
        },
        options: {
          en: ["Stop completely", "Slow down and give priority to others", "Speed up to merge quickly", "Honk to warn others"],
          fr: ["S'arrêter complètement", "Ralentir et céder la priorité aux autres", "Accélérer pour fusionner rapidement", "Klaxonner pour avertir les autres"],
          ar: ["توقف تماماً", "أبطئ وأعط الأولوية للآخرين", "سرّع للاندماج بسرعة", "زمّر لتحذير الآخرين"]
        },
        correctAnswer: 1,
        explanation: {
          en: "At a YIELD sign, slow down and give priority to traffic on the priority road, stopping if necessary.",
          fr: "Au panneau CÉDEZ, ralentissez et cédez la priorité au trafic sur la route prioritaire, en vous arrêtant si nécessaire.",
          ar: "عند إشارة أفسح المجال، أبطئ وأعط الأولوية لحركة المرور على الطريق ذي الأولوية، وتوقف إذا لزم الأمر."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "Who has priority: a vehicle going straight or a vehicle turning?",
          fr: "Qui a la priorité: un véhicule allant tout droit ou un véhicule tournant?",
          ar: "من له الأولوية: مركبة تسير مستقيماً أم مركبة تنعطف؟"
        },
        options: {
          en: ["Turning vehicle", "Vehicle going straight", "Both equal", "Depends on speed"],
          fr: ["Véhicule tournant", "Véhicule allant tout droit", "Les deux égaux", "Dépend de la vitesse"],
          ar: ["المركبة المنعطفة", "المركبة السائرة مستقيماً", "كلاهما متساويان", "يعتمد على السرعة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Vehicles going straight have priority over vehicles turning at an intersection.",
          fr: "Les véhicules allant tout droit ont priorité sur les véhicules tournant à une intersection.",
          ar: "المركبات السائرة مستقيماً لها الأولوية على المركبات المنعطفة في التقاطع."
        },
        category: "right-of-way",
        difficulty: "medium"
      },
      {
        question: {
          en: "When must you yield to emergency vehicles?",
          fr: "Quand devez-vous céder le passage aux véhicules d'urgence?",
          ar: "متى يجب أن تفسح المجال لمركبات الطوارئ؟"
        },
        options: {
          en: ["Only if they're behind you", "Only on highways", "Always, when lights/sirens are active", "Never"],
          fr: ["Seulement s'ils sont derrière vous", "Uniquement sur autoroute", "Toujours, quand les feux/sirènes sont actifs", "Jamais"],
          ar: ["فقط إذا كانوا خلفك", "على الطرق السريعة فقط", "دائماً، عندما تكون الأضواء/صفارات الإنذار مفعلة", "أبداً"]
        },
        correctAnswer: 2,
        explanation: {
          en: "You must always yield to emergency vehicles with active lights and sirens, regardless of direction.",
          fr: "Vous devez toujours céder le passage aux véhicules d'urgence avec feux et sirènes actifs, quelle que soit la direction.",
          ar: "يجب أن تفسح المجال دائماً لمركبات الطوارئ ذات الأضواء وصفارات الإنذار المفعلة، بغض النظر عن الاتجاه."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "When exiting a driveway onto a road, who has priority?",
          fr: "En sortant d'une allée sur une route, qui a la priorité?",
          ar: "عند الخروج من ممر إلى الطريق، من له الأولوية؟"
        },
        options: {
          en: ["Vehicle exiting", "Vehicles on the road", "Both equal", "Whoever honks first"],
          fr: ["Véhicule sortant", "Véhicules sur la route", "Les deux égaux", "Celui qui klaxonne en premier"],
          ar: ["المركبة الخارجة", "المركبات على الطريق", "كلاهما متساويان", "من يزمر أولاً"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Vehicles on the road always have priority over vehicles exiting driveways or parking lots.",
          fr: "Les véhicules sur la route ont toujours priorité sur les véhicules sortant des allées ou parkings.",
          ar: "المركبات على الطريق لها الأولوية دائماً على المركبات الخارجة من الممرات أو مواقف السيارات."
        },
        category: "right-of-way",
        difficulty: "easy"
      },
      {
        question: {
          en: "Who has priority in a narrow passage where both directions cannot pass?",
          fr: "Qui a la priorité dans un passage étroit où les deux directions ne peuvent pas passer?",
          ar: "من له الأولوية في ممر ضيق حيث لا يمكن للاتجاهين المرور؟"
        },
        options: {
          en: ["Vehicle going uphill", "Vehicle going downhill", "Larger vehicle", "Whoever arrives first"],
          fr: ["Véhicule montant", "Véhicule descendant", "Véhicule plus grand", "Celui qui arrive en premier"],
          ar: ["المركبة الصاعدة", "المركبة النازلة", "المركبة الأكبر", "من يصل أولاً"]
        },
        correctAnswer: 0,
        explanation: {
          en: "In narrow passages on hills, vehicles going uphill have priority as it's harder to restart.",
          fr: "Dans les passages étroits en pente, les véhicules montants ont priorité car il est plus difficile de redémarrer.",
          ar: "في الممرات الضيقة على التلال، المركبات الصاعدة لها الأولوية لأن إعادة الانطلاق أصعب."
        },
        category: "right-of-way",
        difficulty: "hard"
      },
      {
        question: {
          en: "When merging onto a highway, who has priority?",
          fr: "En rejoignant une autoroute, qui a la priorité?",
          ar: "عند الاندماج في طريق سريع، من له الأولوية؟"
        },
        options: {
          en: ["Merging vehicle", "Vehicles already on highway", "Both equal", "Faster vehicle"],
          fr: ["Véhicule s'insérant", "Véhicules déjà sur l'autoroute", "Les deux égaux", "Véhicule plus rapide"],
          ar: ["المركبة المندمجة", "المركبات الموجودة على الطريق السريع", "كلاهما متساويان", "المركبة الأسرع"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Vehicles already on the highway have priority; merging vehicles must yield and adjust speed.",
          fr: "Les véhicules déjà sur l'autoroute ont priorité; les véhicules s'insérant doivent céder et ajuster leur vitesse.",
          ar: "المركبات الموجودة على الطريق السريع لها الأولوية؛ المركبات المندمجة يجب أن تفسح المجال وتعدل سرعتها."
        },
        category: "right-of-way",
        difficulty: "medium"
      }
    ]
  },

  // Quiz 4: Safe Driving Practices
  {
    title: {
      en: "Safe Driving Practices",
      fr: "Pratiques de Conduite Sûre",
      ar: "ممارسات القيادة الآمنة"
    },
    description: {
      en: "Learn essential safe driving techniques for Algerian roads.",
      fr: "Apprenez les techniques essentielles de conduite sûre pour les routes algériennes.",
      ar: "تعلم تقنيات القيادة الآمنة الأساسية للطرق الجزائرية."
    },
    category: "vehicle-safety",
    passingScore: 70,
    timeLimit: 30,
    isPublished: true,
    questions: [
      {
        question: {
          en: "What is the safest following distance in normal conditions?",
          fr: "Quelle est la distance de sécurité en conditions normales?",
          ar: "ما هي مسافة الأمان في الظروف العادية؟"
        },
        options: {
          en: ["1 second", "2 seconds", "3 seconds", "5 seconds"],
          fr: ["1 seconde", "2 secondes", "3 secondes", "5 secondes"],
          ar: ["ثانية واحدة", "ثانيتان", "3 ثوان", "5 ثوان"]
        },
        correctAnswer: 1,
        explanation: {
          en: "The '2-second rule' provides a safe following distance in normal dry conditions.",
          fr: "La 'règle des 2 secondes' fournit une distance de sécurité en conditions normales sèches.",
          ar: "قاعدة 'الثانيتين' توفر مسافة أمان في الظروف الجافة العادية."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do if your brakes fail?",
          fr: "Que devez-vous faire si vos freins lâchent?",
          ar: "ماذا يجب أن تفعل إذا فشلت الفرامل؟"
        },
        options: {
          en: ["Jump out of the car", "Use parking brake gradually, downshift, find safe place to stop", "Turn off the engine", "Close your eyes"],
          fr: ["Sauter de la voiture", "Utiliser le frein à main progressivement, rétrograder, trouver un endroit sûr", "Couper le moteur", "Fermer les yeux"],
          ar: ["القفز من السيارة", "استخدم فرامل اليد تدريجياً، انزل السرعة، ابحث عن مكان آمن", "أطفئ المحرك", "أغلق عينيك"]
        },
        correctAnswer: 1,
        explanation: {
          en: "If brakes fail: pump brakes, use parking brake gradually, downshift to lower gears, and find a safe place to stop.",
          fr: "Si les freins lâchent: pompez les freins, utilisez le frein à main progressivement, rétrogradez et trouvez un endroit sûr.",
          ar: "إذا فشلت الفرامل: اضغط على الفرامل بشكل متكرر، استخدم فرامل اليد تدريجياً، انزل إلى سرعات أقل، وابحث عن مكان آمن للتوقف."
        },
        category: "emergency-procedures",
        difficulty: "medium"
      },
      {
        question: {
          en: "When is it safe to use a mobile phone while driving?",
          fr: "Quand est-il sûr d'utiliser un téléphone mobile en conduisant?",
          ar: "متى يكون استخدام الهاتف المحمول آمناً أثناء القيادة؟"
        },
        options: {
          en: ["When stopped at red lights", "Never, unless using hands-free", "On highways only", "When traffic is light"],
          fr: ["Quand arrêté aux feux rouges", "Jamais, sauf avec kit mains-libres", "Sur autoroute uniquement", "Quand le trafic est léger"],
          ar: ["عند التوقف عند الإشارة الحمراء", "أبداً، إلا باستخدام السماعة", "على الطرق السريعة فقط", "عندما يكون المرور خفيفاً"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Using a mobile phone while driving is illegal and dangerous unless using an approved hands-free system.",
          fr: "L'utilisation d'un téléphone en conduisant est illégale et dangereuse sauf avec un système mains-libres approuvé.",
          ar: "استخدام الهاتف المحمول أثناء القيادة غير قانوني وخطير إلا باستخدام نظام يدوي معتمد."
        },
        category: "traffic-rules",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do when driving in fog?",
          fr: "Que devez-vous faire en conduisant dans le brouillard?",
          ar: "ماذا يجب أن تفعل عند القيادة في الضباب؟"
        },
        options: {
          en: ["Use high beams", "Use fog lights and low beams, reduce speed", "Speed up to get through quickly", "Follow closely behind other vehicles"],
          fr: ["Utiliser les feux de route", "Utiliser les feux de brouillard et feux de croisement, réduire la vitesse", "Accélérer pour passer rapidement", "Suivre de près les autres véhicules"],
          ar: ["استخدم الأضواء العالية", "استخدم أضواء الضباب والأضواء المنخفضة، قلل السرعة", "سرّع للمرور بسرعة", "اتبع المركبات الأخرى عن قرب"]
        },
        correctAnswer: 1,
        explanation: {
          en: "In fog: use fog lights and low beams (not high beams), reduce speed significantly, increase following distance.",
          fr: "Dans le brouillard: utilisez les feux de brouillard et croisement (pas les feux de route), réduisez significativement la vitesse.",
          ar: "في الضباب: استخدم أضواء الضباب والأضواء المنخفضة (ليس العالية)، قلل السرعة بشكل كبير، زد مسافة الأمان."
        },
        category: "vehicle-safety",
        difficulty: "medium"
      },
      {
        question: {
          en: "When should you check your mirrors?",
          fr: "Quand devez-vous vérifier vos rétroviseurs?",
          ar: "متى يجب أن تتحقق من المرايا؟"
        },
        options: {
          en: ["Only when changing lanes", "Regularly (every 5-8 seconds)", "Only when reversing", "Once per trip"],
          fr: ["Uniquement lors d'un changement de voie", "Régulièrement (toutes les 5-8 secondes)", "Uniquement en marche arrière", "Une fois par trajet"],
          ar: ["فقط عند تغيير المسار", "بانتظام (كل 5-8 ثوان)", "فقط عند الرجوع للخلف", "مرة واحدة في الرحلة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Good drivers check mirrors regularly (every 5-8 seconds) to maintain awareness of surrounding traffic.",
          fr: "Les bons conducteurs vérifient les rétroviseurs régulièrement (toutes les 5-8 secondes) pour rester conscients du trafic.",
          ar: "السائقون الجيدون يتحققون من المرايا بانتظام (كل 5-8 ثوان) للبقاء على دراية بحركة المرور المحيطة."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What is the correct hand position on the steering wheel?",
          fr: "Quelle est la bonne position des mains sur le volant?",
          ar: "ما هو الوضع الصحيح لليدين على المقود؟"
        },
        options: {
          en: ["12 o'clock with one hand", "9 and 3 o'clock position", "6 o'clock at bottom", "Anywhere comfortable"],
          fr: ["12 heures avec une main", "Position 9h et 3h", "6 heures en bas", "N'importe où confortable"],
          ar: ["الساعة 12 بيد واحدة", "وضع الساعة 9 و3", "الساعة 6 في الأسفل", "أي مكان مريح"]
        },
        correctAnswer: 1,
        explanation: {
          en: "The safest steering position is 9 and 3 o'clock (or 10 and 2), providing best control and airbag safety.",
          fr: "La position de direction la plus sûre est 9h et 3h (ou 10h et 2h), offrant un meilleur contrôle et sécurité airbag.",
          ar: "أكثر وضع آمن للمقود هو الساعة 9 و3 (أو 10 و2)، يوفر أفضل تحكم وأمان للوسادة الهوائية."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do if your vehicle starts to skid?",
          fr: "Que devez-vous faire si votre véhicule commence à déraper?",
          ar: "ماذا يجب أن تفعل إذا بدأت سيارتك بالانزلاق؟"
        },
        options: {
          en: ["Brake hard", "Steer in the direction you want to go, ease off accelerator", "Accelerate out of it", "Turn the wheel hard in opposite direction"],
          fr: ["Freiner fort", "Tourner dans la direction voulue, relâcher l'accélérateur", "Accélérer pour s'en sortir", "Tourner le volant fort dans la direction opposée"],
          ar: ["اضغط على الفرامل بقوة", "وجّه في الاتجاه المطلوب، خفف من الغاز", "سرّع للخروج منه", "أدر المقود بقوة في الاتجاه المعاكس"]
        },
        correctAnswer: 1,
        explanation: {
          en: "In a skid: steer gently in the direction you want to go, ease off accelerator, avoid hard braking.",
          fr: "En cas de dérapage: tournez doucement dans la direction voulue, relâchez l'accélérateur, évitez de freiner fort.",
          ar: "في حالة الانزلاق: وجّه بلطف في الاتجاه المطلوب، خفف من الغاز، تجنب الفرملة القوية."
        },
        category: "emergency-procedures",
        difficulty: "medium"
      },
      {
        question: {
          en: "What should you do before entering a curve?",
          fr: "Que devez-vous faire avant d'entrer dans un virage?",
          ar: "ماذا يجب أن تفعل قبل الدخول في منحنى؟"
        },
        options: {
          en: ["Accelerate", "Reduce speed before the curve", "Brake hard in the curve", "Maintain same speed"],
          fr: ["Accélérer", "Réduire la vitesse avant le virage", "Freiner fort dans le virage", "Maintenir la même vitesse"],
          ar: ["سرّع", "قلل السرعة قبل المنحنى", "اضغط على الفرامل بقوة في المنحنى", "حافظ على نفس السرعة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Always reduce speed BEFORE entering a curve, not while in it, for better control and safety.",
          fr: "Réduisez toujours la vitesse AVANT d'entrer dans un virage, pas pendant, pour un meilleur contrôle et sécurité.",
          ar: "قلل السرعة دائماً قبل الدخول في المنحنى، وليس أثناءه، لتحكم وأمان أفضل."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do if you miss your exit on a highway?",
          fr: "Que devez-vous faire si vous manquez votre sortie sur l'autoroute?",
          ar: "ماذا يجب أن تفعل إذا فاتك مخرجك على الطريق السريع؟"
        },
        options: {
          en: ["Reverse back to the exit", "Continue to next exit", "Stop and back up", "Cross multiple lanes quickly"],
          fr: ["Faire marche arrière jusqu'à la sortie", "Continuer jusqu'à la prochaine sortie", "S'arrêter et reculer", "Traverser plusieurs voies rapidement"],
          ar: ["ارجع للخلف إلى المخرج", "استمر حتى المخرج التالي", "توقف وارجع", "اعبر عدة مسارات بسرعة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "If you miss an exit, continue safely to the next exit - never reverse or stop on a highway.",
          fr: "Si vous manquez une sortie, continuez en toute sécurité jusqu'à la prochaine - ne faites jamais marche arrière sur l'autoroute.",
          ar: "إذا فاتك مخرج، استمر بأمان إلى المخرج التالي - لا ترجع أبداً أو تتوقف على الطريق السريع."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do if you feel drowsy while driving?",
          fr: "Que devez-vous faire si vous vous sentez somnolent en conduisant?",
          ar: "ماذا يجب أن تفعل إذا شعرت بالنعاس أثناء القيادة؟"
        },
        options: {
          en: ["Open windows and continue", "Stop in a safe place and rest", "Drink coffee and keep going", "Drive faster to get home quickly"],
          fr: ["Ouvrir les fenêtres et continuer", "S'arrêter dans un endroit sûr et se reposer", "Boire du café et continuer", "Conduire plus vite pour rentrer rapidement"],
          ar: ["افتح النوافذ واستمر", "توقف في مكان آمن واسترح", "اشرب القهوة واستمر", "قد بسرعة أكبر للوصول بسرعة"]
        },
        correctAnswer: 1,
        explanation: {
          en: "If drowsy, stop in a safe place and rest or sleep. Drowsy driving is as dangerous as drunk driving.",
          fr: "Si somnolent, arrêtez-vous dans un endroit sûr et reposez-vous. La conduite somnolente est aussi dangereuse que l'alcool.",
          ar: "إذا شعرت بالنعاس، توقف في مكان آمن واسترح أو نم. القيادة أثناء النعاس خطيرة كالقيادة تحت تأثير الكحول."
        },
        category: "vehicle-safety",
        difficulty: "easy"
      }
    ]
  },

  // Quiz 5: Parking Rules
  {
    title: {
      en: "Parking Rules and Regulations",
      fr: "Règles et Réglementations de Stationnement",
      ar: "قواعد ولوائح الوقوف"
    },
    description: {
      en: "Learn proper parking techniques and regulations in Algeria.",
      fr: "Apprenez les techniques et réglementations de stationnement en Algérie.",
      ar: "تعلم تقنيات ولوائح الوقوف الصحيحة في الجزائر."
    },
    category: "parking",
    passingScore: 70,
    timeLimit: 25,
    isPublished: true,
    questions: [
      {
        question: {
          en: "How far from a fire hydrant must you park?",
          fr: "À quelle distance d'une bouche d'incendie devez-vous stationner?",
          ar: "على أي مسافة من صنبور الحريق يجب أن تقف؟"
        },
        options: {
          en: ["1 meter", "3 meters", "5 meters", "No restriction"],
          fr: ["1 mètre", "3 mètres", "5 mètres", "Aucune restriction"],
          ar: ["متر واحد", "3 أمتار", "5 أمتار", "لا قيود"]
        },
        correctAnswer: 2,
        explanation: {
          en: "You must park at least 5 meters from a fire hydrant to ensure emergency access.",
          fr: "Vous devez stationner à au moins 5 mètres d'une bouche d'incendie pour assurer l'accès d'urgence.",
          ar: "يجب أن تقف على مسافة 5 أمتار على الأقل من صنبور الحريق لضمان الوصول في حالات الطوارئ."
        },
        category: "parking",
        difficulty: "medium"
      },
      {
        question: {
          en: "When parallel parking, how far should your vehicle be from the curb?",
          fr: "Lors d'un stationnement en créneau, à quelle distance du trottoir doit être votre véhicule?",
          ar: "عند الوقوف الموازي، كم يجب أن تكون المسافة بين سيارتك والرصيف؟"
        },
        options: {
          en: ["Up to 50 cm", "Up to 30 cm", "Up to 1 meter", "Doesn't matter"],
          fr: ["Jusqu'à 50 cm", "Jusqu'à 30 cm", "Jusqu'à 1 mètre", "Peu importe"],
          ar: ["حتى 50 سم", "حتى 30 سم", "حتى متر واحد", "لا يهم"]
        },
        correctAnswer: 1,
        explanation: {
          en: "When parallel parked, your vehicle should be within 30 cm of the curb.",
          fr: "En stationnement en créneau, votre véhicule doit être à moins de 30 cm du trottoir.",
          ar: "عند الوقوف الموازي، يجب أن تكون سيارتك على بعد 30 سم من الرصيف."
        },
        category: "parking",
        difficulty: "medium"
      },
      {
        question: {
          en: "Can you park on a crosswalk?",
          fr: "Pouvez-vous stationner sur un passage piéton?",
          ar: "هل يمكنك الوقوف على ممر المشاة؟"
        },
        options: {
          en: ["Yes, briefly", "No, never", "Only at night", "Only on weekends"],
          fr: ["Oui, brièvement", "Non, jamais", "Uniquement la nuit", "Uniquement le week-end"],
          ar: ["نعم، لفترة قصيرة", "لا، أبداً", "فقط في الليل", "فقط في عطلة نهاية الأسبوع"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Parking on a crosswalk is never allowed as it endangers pedestrians.",
          fr: "Le stationnement sur un passage piéton n'est jamais autorisé car il met en danger les piétons.",
          ar: "الوقوف على ممر المشاة غير مسموح أبداً لأنه يعرض المشاة للخطر."
        },
        category: "parking",
        difficulty: "easy"
      },
      {
        question: {
          en: "What should you do before opening your car door after parking?",
          fr: "Que devez-vous faire avant d'ouvrir la portière après le stationnement?",
          ar: "ماذا يجب أن تفعل قبل فتح باب السيارة بعد الوقوف؟"
        },
        options: {
          en: ["Open quickly", "Check mirrors and look for cyclists/traffic", "Honk first", "Nothing special"],
          fr: ["Ouvrir rapidement", "Vérifier les rétroviseurs et regarder s'il y a des cyclistes/trafic", "Klaxonner d'abord", "Rien de spécial"],
          ar: ["افتح بسرعة", "تحقق من المرايا وابحث عن دراجين/حركة مرور", "زمّر أولاً", "لا شيء خاص"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Always check mirrors and look over your shoulder before opening the door to avoid hitting cyclists or other road users.",
          fr: "Vérifiez toujours les rétroviseurs et regardez par-dessus votre épaule avant d'ouvrir pour éviter de heurter des cyclistes.",
          ar: "تحقق دائماً من المرايا وانظر خلف كتفك قبل فتح الباب لتجنب ضرب راكبي الدراجات أو مستخدمي الطريق الآخرين."
        },
        category: "parking",
        difficulty: "easy"
      },
      {
        question: {
          en: "When parking on a hill facing downhill, which way should your wheels be turned?",
          fr: "En stationnant sur une pente descendante, dans quel sens doivent être tournées vos roues?",
          ar: "عند الوقوف على منحدر هابط، في أي اتجاه يجب أن تكون عجلاتك؟"
        },
        options: {
          en: ["Straight ahead", "Toward the curb", "Away from the curb", "Doesn't matter"],
          fr: ["Tout droit", "Vers le trottoir", "Loin du trottoir", "Peu importe"],
          ar: ["مستقيمة للأمام", "نحو الرصيف", "بعيداً عن الرصيف", "لا يهم"]
        },
        correctAnswer: 1,
        explanation: {
          en: "When parking downhill, turn wheels toward the curb so if the car rolls, it will stop against the curb.",
          fr: "En pente descendante, tournez les roues vers le trottoir pour qu'en cas de mouvement, la voiture s'arrête contre le trottoir.",
          ar: "عند الوقوف على منحدر هابط، أدر العجلات نحو الرصيف حتى إذا تحركت السيارة، ستتوقف عند الرصيف."
        },
        category: "parking",
        difficulty: "medium"
      },
      {
        question: {
          en: "How far from an intersection should you park?",
          fr: "À quelle distance d'une intersection devez-vous stationner?",
          ar: "على أي مسافة من التقاطع يجب أن تقف؟"
        },
        options: {
          en: ["2 meters", "5 meters", "10 meters", "No restriction"],
          fr: ["2 mètres", "5 mètres", "10 mètres", "Aucune restriction"],
          ar: ["2 متر", "5 أمتار", "10 أمتار", "لا قيود"]
        },
        correctAnswer: 1,
        explanation: {
          en: "You should park at least 5 meters from an intersection to maintain visibility for all road users.",
          fr: "Vous devez stationner à au moins 5 mètres d'une intersection pour maintenir la visibilité pour tous.",
          ar: "يجب أن تقف على مسافة 5 أمتار على الأقل من التقاطع للحفاظ على الرؤية لجميع مستخدمي الطريق."
        },
        category: "parking",
        difficulty: "medium"
      },
      {
        question: {
          en: "What does a yellow curb marking mean?",
          fr: "Que signifie un marquage jaune sur le trottoir?",
          ar: "ماذا يعني الخط الأصفر على الرصيف؟"
        },
        options: {
          en: ["Parking allowed", "No parking", "Loading zone only", "Reserved for taxis"],
          fr: ["Stationnement autorisé", "Stationnement interdit", "Zone de chargement uniquement", "Réservé aux taxis"],
          ar: ["الوقوف مسموح", "ممنوع الوقوف", "منطقة تحميل فقط", "محجوز للتاكسي"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Yellow curb markings typically indicate no parking is allowed in that area.",
          fr: "Les marquages jaunes sur le trottoir indiquent généralement que le stationnement est interdit dans cette zone.",
          ar: "علامات الرصيف الصفراء تشير عادة إلى أن الوقوف ممنوع في تلك المنطقة."
        },
        category: "parking",
        difficulty: "easy"
      },
      {
        question: {
          en: "When is double parking allowed?",
          fr: "Quand le double stationnement est-il autorisé?",
          ar: "متى يُسمح بالوقوف المزدوج؟"
        },
        options: {
          en: ["When you'll be quick", "Never", "On weekends", "After 8 PM"],
          fr: ["Quand vous serez rapide", "Jamais", "Le week-end", "Après 20h"],
          ar: ["عندما ستكون سريعاً", "أبداً", "في عطلة نهاية الأسبوع", "بعد الساعة 8 مساءً"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Double parking is never allowed as it blocks traffic and creates hazards.",
          fr: "Le double stationnement n'est jamais autorisé car il bloque la circulation et crée des dangers.",
          ar: "الوقوف المزدوج غير مسموح أبداً لأنه يعيق حركة المرور ويخلق مخاطر."
        },
        category: "parking",
        difficulty: "easy"
      },
      {
        question: {
          en: "What must you always engage when parking?",
          fr: "Que devez-vous toujours engager lors du stationnement?",
          ar: "ماذا يجب أن تشغّل دائماً عند الوقوف؟"
        },
        options: {
          en: ["Hazard lights", "Parking brake/handbrake", "Radio", "Air conditioning"],
          fr: ["Feux de détresse", "Frein à main", "Radio", "Climatisation"],
          ar: ["أضواء الطوارئ", "فرامل اليد", "الراديو", "مكيف الهواء"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Always engage the parking brake when parking to prevent the vehicle from rolling.",
          fr: "Engagez toujours le frein à main lors du stationnement pour empêcher le véhicule de rouler.",
          ar: "شغّل دائماً فرامل اليد عند الوقوف لمنع السيارة من التدحرج."
        },
        category: "parking",
        difficulty: "easy"
      },
      {
        question: {
          en: "Can you park in a disabled parking space without a permit?",
          fr: "Pouvez-vous stationner sur une place handicapé sans permis?",
          ar: "هل يمكنك الوقوف في موقف ذوي الاحتياجات الخاصة بدون تصريح؟"
        },
        options: {
          en: ["Yes, if briefly", "No, never without permit", "Only at night", "Yes, if no disabled person is waiting"],
          fr: ["Oui, si brièvement", "Non, jamais sans permis", "Uniquement la nuit", "Oui, si aucune personne handicapée n'attend"],
          ar: ["نعم، إذا كان لفترة قصيرة", "لا، أبداً بدون تصريح", "فقط في الليل", "نعم، إذا لم يكن هناك شخص معاق ينتظر"]
        },
        correctAnswer: 1,
        explanation: {
          en: "Disabled parking spaces are reserved for permit holders only. Parking without a permit is illegal.",
          fr: "Les places handicapées sont réservées aux titulaires de permis uniquement. Stationner sans permis est illégal.",
          ar: "مواقف ذوي الاحتياجات الخاصة محجوزة لحاملي التصاريح فقط. الوقوف بدون تصريح غير قانوني."
        },
        category: "parking",
        difficulty: "easy"
      }
    ]
  }
];

// ============================================================================
// IMPORT FUNCTION
// ============================================================================

async function importQuizzes() {
  console.log('🚀 Starting Algerian Driving Theory Quiz Bank Import...\n');
  console.log('=' .repeat(60));

  let totalQuestions = 0;
  let successfulQuizzes = 0;

  for (const quizData of QUIZ_BANK) {
    try {
      console.log(`\n📝 Importing: ${quizData.title.en}`);
      console.log(`   Category: ${quizData.category}`);
      console.log(`   Questions: ${quizData.questions.length}`);

      // First, create all questions
      const questionIds = [];
      
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        
        const questionDoc = await db.collection(COLLECTIONS.QUESTIONS).add({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || {},
          category: q.category,
          difficulty: q.difficulty,
          createdAt: admin.firestore.Timestamp.now(),
        });
        
        questionIds.push(questionDoc.id);
      }

      console.log(`   ✅ Created ${questionIds.length} questions`);
      totalQuestions += questionIds.length;

      // Then create the quiz with question IDs
      const quizDoc = await db.collection(COLLECTIONS.QUIZZES).add({
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        questions: questionIds,
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        isPublished: quizData.isPublished,
        createdBy: 'system',
        createdByName: 'System Administrator',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        totalAttempts: 0,
      });

      console.log(`   ✅ Quiz created: ${quizDoc.id}`);
      successfulQuizzes++;

    } catch (error) {
      console.error(`   ❌ Error importing ${quizData.title.en}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Quiz Bank Import Complete!\n');
  console.log('Summary:');
  console.log(`  ✓ Total Quizzes Imported: ${successfulQuizzes}/${QUIZ_BANK.length}`);
  console.log(`  ✓ Total Questions Created: ${totalQuestions}`);
  console.log(`  ✓ Categories: Traffic Rules, Road Signs, Right of Way, Safe Driving, Parking`);
  console.log('\nStudents can now take these quizzes in the app!');
  
  process.exit(0);
}

// Run the import
importQuizzes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
