import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import StudentLayoutClient from '@/components/layout/StudentLayoutClient';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  let userName = 'Student';

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      redirect('/auth/login');
    }

    userName = userDoc.data()?.displayName || 'Student';
  } catch {
    redirect('/auth/login');
  }

  return <StudentLayoutClient userName={userName}>{children}</StudentLayoutClient>;
}
