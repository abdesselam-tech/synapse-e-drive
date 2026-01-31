# Synapse E-Drive 🚗

Comprehensive driving school management platform designed for the Algerian market.

## ✨ Features

### For Administrators
- 👥 Complete user management (students, teachers, admins)
- 📊 Platform-wide analytics and reporting
- 👨‍🏫 Group management and teacher assignment
- ✅ Exam request review and approval
- 🔧 System configuration and monitoring

### For Teachers
- 📅 Schedule management with conflict detection
- 📝 Lesson tracking and student notes
- ✅ Mark lessons complete with performance ratings
- 👥 Group-based teaching (theory classes)
- 📚 Resource sharing and library uploads
- 🎓 Quiz creation and automatic grading
- 📊 Student progress monitoring
- 📆 Unified calendar view (individual + group schedules)

### For Students
- 🚗 Easy lesson booking with search & filters
- 👥 Join theory groups for structured learning
- 📝 Take quizzes with instant results (multilingual)
- 📚 Access learning resources and library
- 🎯 Track driving progress and hours toward exam eligibility
- 📋 Request practical and theory exams
- 🔔 Real-time notifications for all activities
- 📊 Progress dashboard with skill tracking

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** TailwindCSS v4
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Deployment:** Vercel
- **Architecture:** Server Components, Server Actions

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git and GitHub account
- Vercel account (for deployment)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/synapse-e-drive.git
cd synapse-e-drive
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env.local` in the project root:

```bash
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----\n"
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
```

## 🔐 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication (Email/Password)
4. Create Firestore database
5. Create Storage bucket

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 4. Import Quiz Bank (Optional)

To import the pre-built Algerian driving theory quiz bank:

1. Download service account key from Firebase Console
2. Save as `firebase-service-account.json` in project root
3. Run:

```bash
npm run import-quizzes
```

## 📦 Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abdesselam-tech/synapse-e-drive)

### Manual Deploy

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Vercel

Add all variables from `.env.local` to Vercel project settings:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

## 📚 Project Structure

```
synapse-e-drive/
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── import-quizzes.js  # Quiz bank import
│   └── verify-indexes.js  # Index verification
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── admin/        # Admin pages
│   │   ├── teacher/      # Teacher pages
│   │   ├── student/      # Student pages
│   │   └── auth/         # Authentication pages
│   ├── components/        # React components
│   │   ├── ui/           # UI components (Button, Card, etc.)
│   │   ├── bookings/     # Booking components
│   │   ├── groups/       # Group components
│   │   ├── notifications/# Notification components
│   │   ├── quizzes/      # Quiz components
│   │   └── ...
│   └── lib/
│       ├── firebase/     # Firebase config (client & admin)
│       ├── server/
│       │   ├── actions/  # Server actions
│       │   └── validators/ # Zod schemas
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions & constants
├── .env.local            # Environment variables (not in git)
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json# Firestore indexes
└── package.json          # Dependencies
```

## 🎓 Quiz System

The platform includes a comprehensive quiz system with:

- **50+ Questions** covering Algerian driving theory
- **Multilingual Support** (English, French, Arabic)
- **Categories:**
  - Traffic Rules
  - Road Signs
  - Priority & Right of Way
  - Safe Driving Practices
  - Parking Rules

## 📊 Lesson Tracking

Teachers can track student progress with:

- **Specialized Lesson Types** aligned with Algerian curriculum
- **Performance Ratings** (1-5 stars)
- **Skill Tracking** (20+ driving skills)
- **Hours Tracking** toward 20-hour exam requirement
- **Exam Readiness** indicators

## 🧪 Testing

### Local Testing

```bash
npm run dev
```

### Build Testing

```bash
npm run build
npm run start
```

## 🌍 Multilingual Support

Platform supports:
- 🇬🇧 English
- 🇫🇷 French
- 🇩🇿 Arabic (with RTL support)

## 📄 License

All Rights Reserved - Private Project

## 👤 Contact

For questions or support, contact: Abdesselamtech@gmail.com

## 🙏 Acknowledgments

Built for Algerian driving schools with compliance to local traffic laws and regulations.
