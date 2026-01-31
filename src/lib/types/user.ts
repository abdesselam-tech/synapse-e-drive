/**
 * User Profile Types
 */

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'teacher' | 'student';
  phoneNumber?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
  
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
