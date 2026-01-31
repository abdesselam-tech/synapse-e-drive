/**
 * Firestore Index Verification Script
 * Checks which indexes exist and which are missing
 * 
 * Usage: npm run verify-indexes
 * 
 * Prerequisites:
 * - Firebase Admin SDK service account JSON file at project root
 * - File should be named: firebase-service-account.json
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to find service account file
const possiblePaths = [
  path.join(__dirname, '..', 'firebase-service-account.json'),
  path.join(__dirname, '..', 'serviceAccountKey.json'),
  path.join(__dirname, '..', 'firebase-adminsdk.json'),
];

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.log('❌ Firebase service account file not found!');
  console.log('');
  console.log('Please place your service account JSON file in the project root with one of these names:');
  console.log('  - firebase-service-account.json');
  console.log('  - serviceAccountKey.json');
  console.log('  - firebase-adminsdk.json');
  console.log('');
  console.log('To get this file:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file to your project root');
  console.log('');
  console.log('⚠️  IMPORTANT: Add this file to .gitignore!');
  process.exit(1);
}

console.log(`📁 Using service account: ${path.basename(serviceAccountPath)}`);

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Define all required indexes for Synapse E-Drive
const requiredIndexes = [
  // NOTIFICATIONS
  {
    name: 'Notifications by userId and createdAt',
    collection: 'notifications',
    query: (db) => db.collection('notifications')
      .where('userId', '==', 'test-user')
      .orderBy('createdAt', 'desc')
      .limit(1)
  },
  {
    name: 'Notifications by userId and read status',
    collection: 'notifications',
    query: (db) => db.collection('notifications')
      .where('userId', '==', 'test-user')
      .where('read', '==', false)
      .limit(1)
  },
  
  // BOOKINGS
  {
    name: 'Bookings by studentId and status',
    collection: 'bookings',
    query: (db) => db.collection('bookings')
      .where('studentId', '==', 'test-user')
      .where('status', '==', 'confirmed')
      .limit(1)
  },
  {
    name: 'Bookings by teacherId and status',
    collection: 'bookings',
    query: (db) => db.collection('bookings')
      .where('teacherId', '==', 'test-user')
      .where('status', '==', 'confirmed')
      .limit(1)
  },
  {
    name: 'Bookings by scheduleId and status',
    collection: 'bookings',
    query: (db) => db.collection('bookings')
      .where('scheduleId', '==', 'test-schedule')
      .where('status', '==', 'confirmed')
      .limit(1)
  },
  
  // SCHEDULES
  {
    name: 'Schedules by teacherId',
    collection: 'schedules',
    query: (db) => db.collection('schedules')
      .where('teacherId', '==', 'test-user')
      .limit(1)
  },
  {
    name: 'Schedules by status',
    collection: 'schedules',
    query: (db) => db.collection('schedules')
      .where('status', '==', 'available')
      .limit(1)
  },
  
  // GROUPS
  {
    name: 'Groups by status and createdAt',
    collection: 'groups',
    query: (db) => db.collection('groups')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(1)
  },
  {
    name: 'Groups by teacherId',
    collection: 'groups',
    query: (db) => db.collection('groups')
      .where('teacherId', '==', 'test-user')
      .orderBy('createdAt', 'desc')
      .limit(1)
  },
  
  // GROUP MEMBERS
  {
    name: 'Group Members by groupId and status',
    collection: 'groupMembers',
    query: (db) => db.collection('groupMembers')
      .where('groupId', '==', 'test-group')
      .where('status', '==', 'active')
      .limit(1)
  },
  {
    name: 'Group Members by studentId and status',
    collection: 'groupMembers',
    query: (db) => db.collection('groupMembers')
      .where('studentId', '==', 'test-user')
      .where('status', '==', 'active')
      .limit(1)
  },
  
  // GROUP SCHEDULES
  {
    name: 'Group Schedules by groupId',
    collection: 'groupSchedules',
    query: (db) => db.collection('groupSchedules')
      .where('groupId', '==', 'test-group')
      .limit(1)
  },
  
  // GROUP RESOURCES
  {
    name: 'Group Resources by groupId',
    collection: 'groupResources',
    query: (db) => db.collection('groupResources')
      .where('groupId', '==', 'test-group')
      .limit(1)
  },
  
  // QUIZ ATTEMPTS
  {
    name: 'Quiz Attempts by studentId',
    collection: 'quizAttempts',
    query: (db) => db.collection('quizAttempts')
      .where('studentId', '==', 'test-user')
      .limit(1)
  },
  {
    name: 'Quiz Attempts by quizId',
    collection: 'quizAttempts',
    query: (db) => db.collection('quizAttempts')
      .where('quizId', '==', 'test-quiz')
      .limit(1)
  },
  
  // EXAM REQUESTS
  {
    name: 'Exam Requests by studentId',
    collection: 'examRequests',
    query: (db) => db.collection('examRequests')
      .where('studentId', '==', 'test-user')
      .limit(1)
  },
  {
    name: 'Exam Requests by status',
    collection: 'examRequests',
    query: (db) => db.collection('examRequests')
      .where('status', '==', 'pending')
      .limit(1)
  },
  
  // USERS
  {
    name: 'Users by role',
    collection: 'users',
    query: (db) => db.collection('users')
      .where('role', '==', 'student')
      .limit(1)
  },
  
  // LIBRARY
  {
    name: 'Library files by category',
    collection: 'library',
    query: (db) => db.collection('library')
      .where('category', '==', 'theory')
      .limit(1)
  },
  {
    name: 'Library files by uploadedBy',
    collection: 'library',
    query: (db) => db.collection('library')
      .where('uploadedBy', '==', 'test-user')
      .limit(1)
  },
];

async function verifyIndexes() {
  console.log('');
  console.log('🔍 Verifying Firestore Indexes for Synapse E-Drive');
  console.log('='.repeat(70));
  console.log('');

  const missingIndexes = [];
  const existingIndexes = [];
  const errors = [];

  for (const index of requiredIndexes) {
    try {
      process.stdout.write(`⏳ Testing: ${index.name}... `);
      
      await index.query(db).get();
      
      console.log('✅ EXISTS');
      existingIndexes.push(index.name);
      
    } catch (error) {
      if (error.code === 9 || (error.message && error.message.includes('index'))) {
        console.log('❌ MISSING');
        
        const urlMatch = error.message?.match(/https:\/\/[^\s]+/);
        missingIndexes.push({
          name: index.name,
          collection: index.collection,
          url: urlMatch ? urlMatch[0] : null
        });
      } else {
        console.log(`⚠️  ERROR: ${error.code || 'unknown'}`);
        errors.push({
          name: index.name,
          error: error.message || error.code || 'Unknown error'
        });
      }
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total indexes checked: ${requiredIndexes.length}`);
  console.log(`✅ Existing indexes:   ${existingIndexes.length}`);
  console.log(`❌ Missing indexes:    ${missingIndexes.length}`);
  console.log(`⚠️  Errors:            ${errors.length}`);
  console.log('');

  if (missingIndexes.length > 0) {
    console.log('='.repeat(70));
    console.log('🔗 MISSING INDEX CREATION LINKS');
    console.log('='.repeat(70));
    console.log('Click these links to create the missing indexes:');
    console.log('');
    
    missingIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name} (${index.collection})`);
      if (index.url) {
        console.log(`   ${index.url}`);
      } else {
        console.log(`   → Create in Firebase Console → Firestore → Indexes`);
      }
      console.log('');
    });
    
    console.log('💡 TIP: After creating indexes, wait 5-10 minutes for them to build.');
    console.log('🔄 Then run this script again to verify all are created.');
    console.log('');
  }

  if (errors.length > 0) {
    console.log('='.repeat(70));
    console.log('⚠️  ERRORS (not index related)');
    console.log('='.repeat(70));
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name}: ${err.error}`);
    });
    console.log('');
  }

  if (missingIndexes.length === 0 && errors.length === 0) {
    console.log('🎉 SUCCESS! All required indexes exist!');
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('');
  
  process.exit(missingIndexes.length > 0 ? 1 : 0);
}

verifyIndexes().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error.message || error);
  console.error('');
  process.exit(1);
});
