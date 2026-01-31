/**
 * Utility function for merging classNames
 * Combines clsx and tailwind-merge for optimal className handling
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
