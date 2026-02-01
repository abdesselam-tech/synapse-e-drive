/**
 * Admin Layout Client Component
 * Handles mobile navigation and client-side interactions
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { MobileNav, type MobileNavItem } from './MobileNav';
import NotificationBellClient from '@/components/notifications/NotificationBellClient';

const navItems: MobileNavItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/admin/dashboard' },
  { icon: '👥', label: 'Users', href: '/admin/users' },
  { icon: '🔑', label: 'Passcodes', href: '/admin/passcodes' },
  { icon: '📅', label: 'Schedules', href: '/admin/schedules' },
  { icon: '👨‍🎓', label: 'Groups', href: '/admin/groups' },
  { icon: '📚', label: 'Library', href: '/admin/library' },
  { icon: '📝', label: 'Quizzes', href: '/admin/quizzes' },
  { icon: '📋', label: 'Exam Requests', href: '/admin/exam-requests' },
  { icon: '🔔', label: 'Notifications', href: '/admin/notifications' },
  { icon: '👤', label: 'Profile', href: '/admin/profile' },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
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
          role="Admin"
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
              <h1 className="text-xl font-bold text-gray-900">Synapse E-Drive - Admin</h1>
              <div className="flex space-x-4">
                <a
                  href="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/admin/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/users') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Users
                </a>
                <a
                  href="/admin/schedules"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/schedules') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Schedules
                </a>
                <a
                  href="/admin/groups"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/groups') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Groups
                </a>
                <a
                  href="/admin/library"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/library') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Library
                </a>
                <a
                  href="/admin/quizzes"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/quizzes') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Quizzes
                </a>
                <a
                  href="/admin/exam-requests"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/exam-requests') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Exam Requests
                </a>
                <a
                  href="/admin/passcodes"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin/passcodes') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Passcodes
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBellClient />
              <a
                href="/admin/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin/profile') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-gray-900'
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
