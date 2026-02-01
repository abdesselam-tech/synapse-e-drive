import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import TeacherLayoutClient from '@/components/layout/TeacherLayoutClient';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  let userName = 'Teacher';

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'teacher') {
      redirect('/auth/login');
    }

    userName = userDoc.data()?.displayName || 'Teacher';
  } catch {
    redirect('/auth/login');
  }

  return <TeacherLayoutClient userName={userName}>{children}</TeacherLayoutClient>;
}
