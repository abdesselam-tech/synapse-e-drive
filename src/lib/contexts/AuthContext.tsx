'use client';

/**
 * Authentication Context
 * Provides user authentication state throughout the app
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        setFirebaseUser(fbUser);
        setLoading(true);
        setError(null);

        if (fbUser) {
          try {
            // Fetch user document from Firestore
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                id: userDoc.id,
                email: userData.email,
                role: userData.role,
                displayName: userData.displayName,
                createdAt: userData.createdAt?.toDate() ?? new Date(),
                updatedAt: userData.updatedAt?.toDate() ?? new Date(),
              } as User);
            } else {
              setUser(null);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
