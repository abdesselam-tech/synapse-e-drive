/**
 * Firebase Client SDK Exports
 * Re-export all client-side Firebase services
 */

export { auth, db, storage } from './config';
export type { Auth } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';
export type { FirebaseStorage } from 'firebase/storage';
export type { User as FirebaseUser } from 'firebase/auth';
