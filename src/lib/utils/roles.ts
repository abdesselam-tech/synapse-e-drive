/**
 * Role Checking Utilities
 */

import type { UserRole } from '@/lib/types';
import { ROLE_PERMISSIONS } from '@/lib/utils/constants/roles';
import { AuthorizationError } from './errors';

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    teacher: 2,
    student: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Require role or throw error
 */
export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): void {
  if (!hasRole(userRole, requiredRole)) {
    throw new AuthorizationError(`This action requires ${requiredRole} role`);
  }
}

/**
 * Require any of the roles or throw error
 */
export function requireAnyRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): void {
  if (!hasAnyRole(userRole, requiredRoles)) {
    throw new AuthorizationError(`This action requires one of: ${requiredRoles.join(', ')}`);
  }
}

/**
 * Check permission
 */
export function hasPermission(
  userRole: UserRole | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.admin
): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false;
}

/**
 * Require permission or throw error
 */
export function requirePermission(
  userRole: UserRole | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.admin
): void {
  if (!hasPermission(userRole, permission)) {
    throw new AuthorizationError(`This action requires permission: ${permission}`);
  }
}
