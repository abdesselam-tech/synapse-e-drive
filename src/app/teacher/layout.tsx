import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import NotificationBellClient from '@/components/notifications/NotificationBellClient';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Synapse E-Drive - Teacher</h1>
              <div className="flex space-x-4">
                <a href="/teacher/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/teacher/schedules" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  My Schedules
                </a>
                <a href="/teacher/bookings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Bookings
                </a>
                <a href="/teacher/students" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Students
                </a>
                <a href="/teacher/groups" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Groups
                </a>
                <a href="/teacher/library" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Library
                </a>
                <a href="/teacher/quizzes" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Quizzes
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userName}</span>
              <NotificationBellClient />
              <a href="/teacher/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </a>
              <a href="/api/auth/logout" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
