/**
 * Role constants and permissions
 */

import type { UserRole } from '@/lib/types';

export const ROLES: Record<UserRole, UserRole> = {
  admin: 'admin',
  teacher: 'teacher',
  student: 'student',
} as const;

export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canManageSchedules: true,
    canManageQuizzes: true,
    canManageLibrary: true,
    canViewAllData: true,
    canManageExamRequests: true,
  },
  teacher: {
    canManageUsers: false,
    canManageSchedules: true,
    canManageQuizzes: true,
    canManageLibrary: true,
    canViewAllData: false,
    canManageExamRequests: true,
  },
  student: {
    canManageUsers: false,
    canManageSchedules: false,
    canManageQuizzes: false,
    canManageLibrary: false,
    canViewAllData: false,
    canManageExamRequests: false,
  },
} as const;
