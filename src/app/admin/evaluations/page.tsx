/**
 * Admin Evaluations Hub
 * Central page for reviewing exam requests with student evaluation data
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { getPendingExamRequests, getStudentEvaluationData } from '@/lib/server/actions/examForms';
import EvaluationsClient from './client';

export default async function AdminEvaluationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verify user is admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      redirect('/admin/dashboard');
    }

    // Get pending exam requests
    const pendingRequests = await getPendingExamRequests();

    // Get all groups for filtering
    const groupsSnapshot = await adminDb.collection(COLLECTIONS.GROUPS).get();
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      teacherName: doc.data().teacherName,
    }));

    // Get all teachers for filtering
    const teachersSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('role', '==', 'teacher')
      .get();
    const teachers = teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().displayName || 'Unknown',
    }));

    return (
      <EvaluationsClient
        initialRequests={pendingRequests}
        groups={groups}
        teachers={teachers}
      />
    );
  } catch (error) {
    console.error('Error loading evaluations page:', error);
    redirect('/admin/dashboard');
  }
}
