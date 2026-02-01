/**
 * Group Types
 * Defines data structures for the group-based learning system
 */

export type GroupStatus = 'active' | 'inactive' | 'archived';

/**
 * Rank definition for a group
 * Each rank unlocks specific features for students
 */
export interface RankDefinition {
  level: number;              // 1, 2, 3 ...
  label: string;              // e.g. "Code Interne", "Conduite Urbaine", "Conduite Autoroute"
  labelAr?: string;           // Arabic label
  labelFr?: string;           // French label (default)
  unlockedFeatures: string[]; // Feature keys unlocked at this rank, e.g. ["book_conduite", "quiz_advanced"]
}

export interface Group {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  maxStudents: number;
  currentStudents: number;
  status: GroupStatus;
  schedule?: string; // e.g., "Mon/Wed 10:00-12:00"
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  
  // Ranking system
  ranks?: RankDefinition[];   // Ordered list of rank tiers defined for this group
  
  // Pinned resources
  resources?: string[];       // Library document IDs that are "pinned" to this group
}

export type LearningPhase = 'code' | 'creneau' | 'conduite' | 'exam-preparation' | 'passed';

export interface GroupMember {
  id: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  joinedAt: string;
  status: 'active' | 'removed' | 'changed';
  leftAt?: string;
  removedAt?: string;
  removedBy?: string;
  // Phase tracking fields
  phase?: LearningPhase;
  phaseUpdatedAt?: string;
  phaseUpdatedBy?: string | null;
  phaseNotes?: string | null;
  consecutiveAbsences?: number;
}

export interface GroupSchedule {
  id: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  lessonType: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  attendanceRequired: boolean;
  createdAt: string;
}

export type GroupResourceType = 'library-reference' | 'quiz-reference' | 'external-link' | 'uploaded-file';

export interface GroupResource {
  id: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  
  // Resource Type
  type: GroupResourceType;
  
  // For library-reference
  libraryFileId?: string;
  libraryFileName?: string;
  libraryFileUrl?: string;
  libraryCategory?: string;
  
  // For quiz-reference
  quizId?: string;
  quizTitle?: string;
  quizQuestionCount?: number;
  
  // For external-link
  externalUrl?: string;
  
  // For uploaded-file
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  
  uploadedAt: string;
}

export type CreateGroupInput = {
  name: string;
  description: string;
  teacherId: string;
  maxStudents: number;
  schedule?: string;
  startDate?: string;
  endDate?: string;
};

export type UpdateGroupInput = Partial<CreateGroupInput> & {
  status?: GroupStatus;
};
