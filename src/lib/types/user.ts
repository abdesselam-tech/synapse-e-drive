/**
 * User Profile Types
 */

export type SupportedLanguage = 'fr' | 'ar' | 'en';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'teacher' | 'student';
  phoneNumber?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Group & Ranking (for students)
  groupId?: string;           // The group the student currently belongs to
  rank?: number;              // Current rank within their group (1-based). null if not yet ranked.
  
  // Language preference
  language?: SupportedLanguage;  // User's preferred language. Default: "fr"
  
  // Student-specific fields
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  
  // Teacher-specific fields
  bio?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
}

export type UpdateProfileInput = {
  displayName?: string;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  bio?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
