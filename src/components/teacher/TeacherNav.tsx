/**
 * Teacher Navigation Component
 * Navigation menu for teacher pages
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, BookOpen, FileText, Calendar, Users } from 'lucide-react';

const navItems = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/schedules', label: 'Schedules', icon: Calendar },
  { href: '/teacher/students', label: 'Students', icon: Users },
  { href: '/teacher/quizzes', label: 'Quizzes', icon: FileText },
  { href: '/teacher/library', label: 'Library', icon: BookOpen },
];

export function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  'hover:bg-gray-100 hover:text-gray-900',
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
