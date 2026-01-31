/**
 * Firebase Admin SDK Configuration
 * Use this in server-side files only (under /src/lib/server)
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

// Initialize Firebase Admin (singleton pattern)
let adminApp: App;
if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
} else {
  adminApp = getApps()[0];
}

// Initialize Firebase Admin services
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);

export default adminApp;
