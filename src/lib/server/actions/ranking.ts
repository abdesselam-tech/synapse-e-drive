'use server';

/**
 * Ranking Server Actions
 * Manage student ranks within groups
 */

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { createNotification } from './notifications';
import type { RankInfo, RankUpInput, SetRankInput, TransferGroupInput } from '@/lib/types/ranking';
import type { RankDefinition } from '@/lib/types/group';
import { DEFAULT_RANKS } from '@/lib/types/ranking';

// ============================================================================
// HELPERS
// ============================================================================

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}

async function getUserRole(userId: string): Promise<string | null> {
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
  return userDoc.exists ? userDoc.data()?.role : null;
}

async function isAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === 'admin';
}

async function isTeacher(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === 'teacher';
}

function getRankLabel(ranks: RankDefinition[], level: number, language: string = 'fr'): string {
  const rank = ranks.find(r => r.level === level);
  if (!rank) return `Rank ${level}`;
  
  if (language === 'ar' && rank.labelAr) return rank.labelAr;
  if (language === 'fr' && rank.labelFr) return rank.labelFr;
  return rank.label;
}

function getUnlockedFeatures(ranks: RankDefinition[], level: number): string[] {
  const rank = ranks.find(r => r.level === level);
  return rank?.unlockedFeatures || [];
}

// ============================================================================
// SCHEMAS
// ============================================================================

const rankUpSchema = z.object({
  studentId: z.string().min(1),
  groupId: z.string().min(1),
  reason: z.string().optional(),
});

const setRankSchema = z.object({
  studentId: z.string().min(1),
  groupId: z.string().min(1),
  rank: z.number().int().min(1),
  reason: z.string().optional(),
});

const transferGroupSchema = z.object({
  studentId: z.string().min(1),
  newGroupId: z.string().min(1),
  reason: z.string().optional(),
});

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Get a student's current rank information
 */
export async function getStudentRankInfo(studentId: string): Promise<RankInfo | null> {
  try {
    // Get student document
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(studentId).get();
    if (!studentDoc.exists) return null;
    
    const studentData = studentDoc.data()!;
    if (studentData.role !== 'student') return null;
    
    const groupId = studentData.groupId;
    const currentRank = studentData.rank || 1;
    
    // If no group, return minimal info
    if (!groupId) {
      return {
        studentId,
        studentName: studentData.displayName || 'Unknown',
        groupId: null,
        groupName: null,
        currentRank: 1,
        currentRankLabel: 'Not Enrolled',
        maxRank: 1,
        unlockedFeatures: [],
      };
    }
    
    // Get group document
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      return {
        studentId,
        studentName: studentData.displayName || 'Unknown',
        groupId: null,
        groupName: null,
        currentRank: 1,
        currentRankLabel: 'Group Not Found',
        maxRank: 1,
        unlockedFeatures: [],
      };
    }
    
    const groupData = groupDoc.data()!;
    const ranks = groupData.ranks || DEFAULT_RANKS;
    const maxRank = Math.max(...ranks.map((r: RankDefinition) => r.level));
    const language = studentData.language || 'fr';
    
    const rankInfo: RankInfo = {
      studentId,
      studentName: studentData.displayName || 'Unknown',
      groupId,
      groupName: groupData.name,
      currentRank,
      currentRankLabel: getRankLabel(ranks, currentRank, language),
      maxRank,
      unlockedFeatures: getUnlockedFeatures(ranks, currentRank),
    };
    
    // Add next rank info if not at max
    if (currentRank < maxRank) {
      rankInfo.nextRankLabel = getRankLabel(ranks, currentRank + 1, language);
    }
    
    return rankInfo;
  } catch (error) {
    console.error('Error getting student rank info:', error);
    return null;
  }
}

/**
 * Rank up a student by 1 level
 * Called automatically when exam is passed, or manually by admin
 */
export async function rankUpStudent(input: unknown): Promise<{
  success: boolean;
  newRank?: number;
  newRankLabel?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = rankUpSchema.parse(input);
    const user = await getCurrentUser();
    
    // Only admin can rank up students
    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return { success: false, error: 'Permission denied. Only admins can rank up students.' };
    }
    
    // Get student document
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    if (!studentDoc.exists) {
      return { success: false, error: 'Student not found' };
    }
    
    const studentData = studentDoc.data()!;
    if (studentData.role !== 'student') {
      return { success: false, error: 'User is not a student' };
    }
    
    // Verify student is in the specified group
    if (studentData.groupId !== validated.groupId) {
      return { success: false, error: 'Student is not in this group' };
    }
    
    // Get group to check max rank
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }
    
    const groupData = groupDoc.data()!;
    const ranks = groupData.ranks || DEFAULT_RANKS;
    const maxRank = Math.max(...ranks.map((r: RankDefinition) => r.level));
    const currentRank = studentData.rank || 1;
    
    if (currentRank >= maxRank) {
      return { success: false, error: 'Student is already at maximum rank' };
    }
    
    const newRank = currentRank + 1;
    const language = studentData.language || 'fr';
    const newRankLabel = getRankLabel(ranks, newRank, language);
    
    // Update student rank
    await studentDoc.ref.update({
      rank: newRank,
      updatedAt: Timestamp.now(),
    });
    
    // Notify student
    await createNotification({
      userId: validated.studentId,
      type: 'group_joined' as 'booking_confirmed', // Using existing type
      priority: 'high',
      title: '🎉 Félicitations ! Promotion de rang',
      message: `Vous avez été promu au rang ${newRankLabel} dans ${groupData.name}.${validated.reason ? ` Raison: ${validated.reason}` : ''}`,
      actionUrl: `/student/dashboard`,
    });
    
    // Write to activity feed (will be implemented)
    // await writeActivityEntry({ ... });
    
    // Write log (will be implemented)
    // await writeLog({ ... });
    
    return {
      success: true,
      newRank,
      newRankLabel,
      message: `${studentData.displayName} promoted to ${newRankLabel}`,
    };
  } catch (error) {
    console.error('Error ranking up student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rank up student',
    };
  }
}

/**
 * Set a student's rank to a specific level (admin only)
 */
export async function setStudentRank(input: unknown): Promise<{
  success: boolean;
  newRank?: number;
  newRankLabel?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = setRankSchema.parse(input);
    const user = await getCurrentUser();
    
    // Only admin can set ranks
    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return { success: false, error: 'Permission denied. Only admins can set student ranks.' };
    }
    
    // Get student document
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    if (!studentDoc.exists) {
      return { success: false, error: 'Student not found' };
    }
    
    const studentData = studentDoc.data()!;
    if (studentData.role !== 'student') {
      return { success: false, error: 'User is not a student' };
    }
    
    // Verify student is in the specified group
    if (studentData.groupId !== validated.groupId) {
      return { success: false, error: 'Student is not in this group' };
    }
    
    // Get group to validate rank bounds
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }
    
    const groupData = groupDoc.data()!;
    const ranks = groupData.ranks || DEFAULT_RANKS;
    const maxRank = Math.max(...ranks.map((r: RankDefinition) => r.level));
    const minRank = Math.min(...ranks.map((r: RankDefinition) => r.level));
    
    if (validated.rank < minRank || validated.rank > maxRank) {
      return { success: false, error: `Rank must be between ${minRank} and ${maxRank}` };
    }
    
    const language = studentData.language || 'fr';
    const newRankLabel = getRankLabel(ranks, validated.rank, language);
    const oldRank = studentData.rank || 1;
    
    // Update student rank
    await studentDoc.ref.update({
      rank: validated.rank,
      updatedAt: Timestamp.now(),
    });
    
    // Notify student
    const direction = validated.rank > oldRank ? 'promu' : 'ajusté';
    await createNotification({
      userId: validated.studentId,
      type: 'group_joined' as 'booking_confirmed',
      priority: 'normal',
      title: `📊 Rang ${direction}`,
      message: `Votre rang a été ${direction} à ${newRankLabel} dans ${groupData.name}.${validated.reason ? ` Raison: ${validated.reason}` : ''}`,
      actionUrl: `/student/dashboard`,
    });
    
    return {
      success: true,
      newRank: validated.rank,
      newRankLabel,
      message: `${studentData.displayName}'s rank set to ${newRankLabel}`,
    };
  } catch (error) {
    console.error('Error setting student rank:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set student rank',
    };
  }
}

/**
 * Transfer a student to a new group
 * Preserves rank (capped at new group's max rank)
 */
export async function transferStudentGroup(input: unknown): Promise<{
  success: boolean;
  newGroupId?: string;
  newGroupName?: string;
  newRank?: number;
  message?: string;
  error?: string;
}> {
  try {
    const validated = transferGroupSchema.parse(input);
    const user = await getCurrentUser();
    
    // Only admin can transfer students
    const userIsAdmin = await isAdmin(user.uid);
    if (!userIsAdmin) {
      return { success: false, error: 'Permission denied. Only admins can transfer students.' };
    }
    
    // Get student document
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    if (!studentDoc.exists) {
      return { success: false, error: 'Student not found' };
    }
    
    const studentData = studentDoc.data()!;
    if (studentData.role !== 'student') {
      return { success: false, error: 'User is not a student' };
    }
    
    const oldGroupId = studentData.groupId;
    const currentRank = studentData.rank || 1;
    
    // Get new group
    const newGroupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.newGroupId).get();
    if (!newGroupDoc.exists) {
      return { success: false, error: 'New group not found' };
    }
    
    const newGroupData = newGroupDoc.data()!;
    if (newGroupData.status !== 'active') {
      return { success: false, error: 'Cannot transfer to inactive group' };
    }
    
    // Check capacity
    if (newGroupData.currentStudents >= newGroupData.maxStudents) {
      return { success: false, error: 'New group is at full capacity' };
    }
    
    // Calculate new rank (cap at new group's max)
    const newRanks = newGroupData.ranks || DEFAULT_RANKS;
    const newMaxRank = Math.max(...newRanks.map((r: RankDefinition) => r.level));
    const newRank = Math.min(currentRank, newMaxRank);
    
    // Update student
    await studentDoc.ref.update({
      groupId: validated.newGroupId,
      rank: newRank,
      updatedAt: Timestamp.now(),
    });
    
    // Update old group member status (if exists)
    if (oldGroupId) {
      const oldMemberQuery = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('groupId', '==', oldGroupId)
        .where('studentId', '==', validated.studentId)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      if (!oldMemberQuery.empty) {
        await oldMemberQuery.docs[0].ref.update({
          status: 'changed',
          leftAt: Timestamp.now(),
        });
      }
      
      // Decrement old group count
      const oldGroupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(oldGroupId).get();
      if (oldGroupDoc.exists) {
        const oldCount = oldGroupDoc.data()?.currentStudents || 0;
        await oldGroupDoc.ref.update({
          currentStudents: Math.max(0, oldCount - 1),
        });
      }
    }
    
    // Create new group member record
    await adminDb.collection(COLLECTIONS.GROUP_MEMBERS).add({
      groupId: validated.newGroupId,
      groupName: newGroupData.name,
      studentId: validated.studentId,
      studentName: studentData.displayName || 'Unknown',
      studentEmail: studentData.email || '',
      status: 'active',
      joinedAt: Timestamp.now(),
      phase: 'code', // Reset phase on transfer
      phaseUpdatedAt: Timestamp.now(),
      phaseUpdatedBy: null,
      phaseNotes: validated.reason || 'Transferred from another group',
      consecutiveAbsences: 0,
    });
    
    // Increment new group count
    await newGroupDoc.ref.update({
      currentStudents: (newGroupData.currentStudents || 0) + 1,
    });
    
    // Notify student
    const language = studentData.language || 'fr';
    const newRankLabel = getRankLabel(newRanks, newRank, language);
    
    await createNotification({
      userId: validated.studentId,
      type: 'group_joined' as 'booking_confirmed',
      priority: 'high',
      title: '🔄 Transfert de groupe',
      message: `Vous avez été transféré au groupe "${newGroupData.name}". Votre rang: ${newRankLabel}.${validated.reason ? ` Raison: ${validated.reason}` : ''}`,
      actionUrl: `/student/groups/${validated.newGroupId}`,
    });
    
    // Notify new group teacher
    await createNotification({
      userId: newGroupData.teacherId,
      type: 'group_student_joined' as 'booking_confirmed',
      priority: 'normal',
      title: '👤 Nouveau membre transféré',
      message: `${studentData.displayName} a été transféré dans votre groupe "${newGroupData.name}".`,
      actionUrl: `/teacher/groups/${validated.newGroupId}`,
    });
    
    return {
      success: true,
      newGroupId: validated.newGroupId,
      newGroupName: newGroupData.name,
      newRank,
      message: `${studentData.displayName} transferred to ${newGroupData.name}`,
    };
  } catch (error) {
    console.error('Error transferring student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transfer student',
    };
  }
}

/**
 * Check if a student has a specific feature unlocked based on their rank
 */
export async function hasFeatureUnlocked(studentId: string, feature: string): Promise<boolean> {
  try {
    const rankInfo = await getStudentRankInfo(studentId);
    if (!rankInfo) return false;
    
    return rankInfo.unlockedFeatures.includes(feature);
  } catch (error) {
    console.error('Error checking feature unlock:', error);
    return false;
  }
}
