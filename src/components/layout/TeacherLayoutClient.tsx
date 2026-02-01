/**
 * Teacher Layout Client Component
 * Handles mobile navigation and client-side interactions
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { MobileNav, type MobileNavItem } from './MobileNav';
import NotificationBellClient from '@/components/notifications/NotificationBellClient';

const navItems: MobileNavItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/teacher/dashboard' },
  { icon: '📅', label: 'Schedules', href: '/teacher/schedules' },
  { icon: '🚗', label: 'Bookings', href: '/teacher/bookings' },
  { icon: '👨‍🎓', label: 'Groups', href: '/teacher/groups' },
  { icon: '👥', label: 'Students', href: '/teacher/students' },
  { icon: '📚', label: 'Library', href: '/teacher/library' },
  { icon: '📝', label: 'Quizzes', href: '/teacher/quizzes' },
  { icon: '🔔', label: 'Notifications', href: '/teacher/notifications' },
  { icon: '👤', label: 'Profile', href: '/teacher/profile' },
];

interface TeacherLayoutClientProps {
  children: React.ReactNode;
  userName: string;
}

export default function TeacherLayoutClient({ children, userName }: TeacherLayoutClientProps) {
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
          role="Teacher"
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
              <h1 className="text-xl font-bold text-gray-900">Synapse E-Drive - Teacher</h1>
              <div className="flex space-x-4">
                <a
                  href="/teacher/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/teacher/schedules"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/schedules') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  My Schedules
                </a>
                <a
                  href="/teacher/bookings"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/bookings') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Bookings
                </a>
                <a
                  href="/teacher/students"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/students') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Students
                </a>
                <a
                  href="/teacher/groups"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/groups') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Groups
                </a>
                <a
                  href="/teacher/library"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/library') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Library
                </a>
                <a
                  href="/teacher/quizzes"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/teacher/quizzes') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Quizzes
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userName}</span>
              <NotificationBellClient />
              <a
                href="/teacher/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/teacher/profile') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
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
