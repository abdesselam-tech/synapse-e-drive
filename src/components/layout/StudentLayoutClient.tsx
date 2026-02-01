/**
 * Student Layout Client Component
 * Handles mobile navigation and client-side interactions
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { MobileNav, type MobileNavItem } from './MobileNav';
import NotificationBellClient from '@/components/notifications/NotificationBellClient';

const navItems: MobileNavItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/student/dashboard' },
  { icon: '🚗', label: 'Bookings', href: '/student/bookings' },
  { icon: '👨‍🎓', label: 'Groups', href: '/student/groups' },
  { icon: '📝', label: 'Quizzes', href: '/student/quizzes' },
  { icon: '📚', label: 'Library', href: '/student/library' },
  { icon: '📋', label: 'Exam Requests', href: '/student/exam-requests' },
  { icon: '🔔', label: 'Notifications', href: '/student/notifications' },
  { icon: '👤', label: 'Profile', href: '/student/profile' },
];

interface StudentLayoutClientProps {
  children: React.ReactNode;
  userName: string;
}

export default function StudentLayoutClient({ children, userName }: StudentLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between px-4 h-14 bg-white border-b border-gray-200 sticky top-0 z-30 shrink-0">
        <MobileNav
          navItems={navItems}
          title="Synapse"
          role="Student"
          onLogout={handleLogout}
        />
        <span className="font-semibold text-sm text-gray-900">Synapse E-Drive</span>
        <NotificationBellClient />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Synapse E-Drive - Student</h1>
              <div className="flex space-x-4">
                <a
                  href="/student/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/student/bookings"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/bookings') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  My Bookings
                </a>
                <a
                  href="/student/groups"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/groups') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Groups
                </a>
                <a
                  href="/student/quizzes"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/quizzes') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Quizzes
                </a>
                <a
                  href="/student/library"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/library') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Library
                </a>
                <a
                  href="/student/exam-requests"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/student/exam-requests') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Exams
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userName}</span>
              <NotificationBellClient />
              <a
                href="/student/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/student/profile') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
