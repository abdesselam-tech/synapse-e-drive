/**
 * Date Utility Functions
 * Using date-fns for date manipulation
 */

import { format, formatDistance, formatRelative, isPast, isFuture, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, formatStr: string = 'PPp'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format date as relative to now (e.g., "today at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, new Date());
}

/**
 * Check if date is in the past
 */
export function isDatePast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isPast(dateObj);
}

/**
 * Check if date is in the future
 */
export function isDateFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(dateObj);
}

/**
 * Format schedule time range
 */
export function formatTimeRange(startTime: Date | string, endTime: Date | string): string {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
  
  return `${format(start, 'PPp')} - ${format(end, 'p')}`;
}
