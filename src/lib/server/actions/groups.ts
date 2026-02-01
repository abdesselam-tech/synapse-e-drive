/**
 * Group Server Actions
 * CRUD operations for the group-based learning system
 */

'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import {
  createGroupSchema,
  updateGroupSchema,
  joinGroupSchema,
  createGroupScheduleSchema,
  createGroupResourceSchema,
} from '../validators/group';
import type { Group, GroupMember, GroupSchedule, GroupResource } from '@/lib/types/group';
import {
  notifyGroupJoined,
  notifyGroupRemoved,
  notifyGroupScheduleCreated,
  notifyGroupResourceAdded,
  notifyTeacherStudentJoined,
  notifyTeacherStudentLeft,
} from './notifications';

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

function timestampToISO(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && '_seconds' in value) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

function convertDocToPlain<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  const data = doc.data();
  if (!data) return null;

  const plain: Record<string, unknown> = { id: doc.id };
  
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      plain[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && '_seconds' in value) {
      plain[key] = new Date((value as { _seconds: number })._seconds * 1000).toISOString();
    } else {
      plain[key] = value;
    }
  }

  return plain as T;
}

// ============================================================================
// ADMIN: GROUP MANAGEMENT
// ============================================================================

/**
 * Admin: Create a new group
 */
export async function createGroup(input: unknown): Promise<{
  success: boolean;
  groupId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createGroupSchema.parse(input);
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can create groups');
    }

    // Get teacher info
    const teacherDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.teacherId).get();
    if (!teacherDoc.exists || teacherDoc.data()?.role !== 'teacher') {
      throw new Error('Invalid teacher');
    }

    const teacherData = teacherDoc.data()!;
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const adminData = userDoc.data()!;

    const groupData = {
      name: validated.name,
      description: validated.description,
      teacherId: validated.teacherId,
      teacherName: teacherData.displayName || teacherData.email,
      maxStudents: validated.maxStudents,
      currentStudents: 0,
      status: 'active',
      schedule: validated.schedule || null,
      startDate: validated.startDate ? Timestamp.fromDate(new Date(validated.startDate)) : null,
      endDate: validated.endDate ? Timestamp.fromDate(new Date(validated.endDate)) : null,
      createdBy: user.uid,
      createdByName: adminData.displayName || adminData.email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.GROUPS).add(groupData);

    return {
      success: true,
      groupId: docRef.id,
      message: 'Group created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create group',
    };
  }
}

/**
 * Admin: Get all groups
 */
export async function getAllGroups(): Promise<Group[]> {
  try {
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs
      .map(doc => convertDocToPlain<Group>(doc))
      .filter((g): g is Group => g !== null);
  } catch (error) {
    console.error('Error getting all groups:', error);
    throw error;
  }
}

/**
 * Admin: Update a group
 */
export async function updateGroup(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updateGroupSchema.parse(input);
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can update groups');
    }

    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (validated.name) updates.name = validated.name;
    if (validated.description) updates.description = validated.description;
    if (validated.maxStudents) updates.maxStudents = validated.maxStudents;
    if (validated.schedule !== undefined) updates.schedule = validated.schedule || null;
    if (validated.status) updates.status = validated.status;
    
    if (validated.startDate !== undefined) {
      updates.startDate = validated.startDate ? Timestamp.fromDate(new Date(validated.startDate)) : null;
    }
    
    if (validated.endDate !== undefined) {
      updates.endDate = validated.endDate ? Timestamp.fromDate(new Date(validated.endDate)) : null;
    }

    if (validated.teacherId) {
      const teacherDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.teacherId).get();
      if (!teacherDoc.exists || teacherDoc.data()?.role !== 'teacher') {
        throw new Error('Invalid teacher');
      }
      const teacherData = teacherDoc.data()!;
      updates.teacherId = validated.teacherId;
      updates.teacherName = teacherData.displayName || teacherData.email;
    }

    await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).update(updates);

    return {
      success: true,
      message: 'Group updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update group',
    };
  }
}

/**
 * Admin: Delete a group and all related data (notifies all members)
 */
export async function deleteGroup(groupId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can delete groups');
    }

    // Get group data first for notification
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }
    const groupData = groupDoc.data()!;

    // Get all group members to notify them
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('status', '==', 'active')
      .get();

    // Notify all active members before deletion
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      try {
        await notifyGroupRemoved(groupId, memberData.studentId, groupData.name);
      } catch (notifError) {
        console.error('Error sending group removal notification:', notifError);
      }
    }

    const batch = adminDb.batch();

    // Delete all group members (including inactive)
    const allMembersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .get();
    allMembersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete all group schedules
    const schedulesSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_SCHEDULES)
      .where('groupId', '==', groupId)
      .get();
    schedulesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete all group resources
    const resourcesSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_RESOURCES)
      .where('groupId', '==', groupId)
      .get();
    resourcesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete the group
    batch.delete(adminDb.collection(COLLECTIONS.GROUPS).doc(groupId));

    await batch.commit();

    return {
      success: true,
      message: `Group deleted. ${membersSnapshot.size} member(s) notified.`,
    };
  } catch (error: unknown) {
    console.error('Error deleting group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete group',
    };
  }
}

/**
 * Get group by ID
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  try {
    const doc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!doc.exists) return null;
    return convertDocToPlain<Group>(doc);
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
}

// ============================================================================
// STUDENT: GROUP BROWSING & JOINING
// ============================================================================

/**
 * Student: Get available groups (active with capacity)
 */
export async function getAvailableGroups(): Promise<Group[]> {
  try {
    await getCurrentUser();

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs
      .map(doc => convertDocToPlain<Group>(doc))
      .filter((g): g is Group => g !== null && g.currentStudents < g.maxStudents);
  } catch (error) {
    console.error('Error getting available groups:', error);
    throw error;
  }
}

/**
 * Get student's joined groups
 */
export async function getStudentGroups(studentId: string): Promise<Group[]> {
  try {
    const user = await getCurrentUser();
    
    // Students can only see their own groups (or admin can see all)
    if (user.uid !== studentId && !await isAdmin(user.uid)) {
      throw new Error('Unauthorized');
    }

    // Get student's active memberships
    const membershipsSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .get();

    const groupIds = membershipsSnapshot.docs.map(doc => doc.data().groupId);

    if (groupIds.length === 0) return [];

    // Get group details
    const groupDocs = await Promise.all(
      groupIds.map(id => adminDb.collection(COLLECTIONS.GROUPS).doc(id).get())
    );

    return groupDocs
      .map(doc => convertDocToPlain<Group>(doc))
      .filter((g): g is Group => g !== null);
  } catch (error) {
    console.error('Error getting student groups:', error);
    throw error;
  }
}

/**
 * Student: Join a group
 * Note: Students can only be in ONE group at a time
 */
export async function joinGroup(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = joinGroupSchema.parse(input);
    const user = await getCurrentUser();

    // Get user info
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      throw new Error('Only students can join groups');
    }

    const userData = userDoc.data()!;

    // ✅ Check if student is already in ANY active group (one group limit)
    const anyExistingMembership = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', user.uid)
      .where('status', '==', 'active')
      .get();

    if (!anyExistingMembership.empty) {
      const currentGroup = anyExistingMembership.docs[0].data();
      throw new Error(`You are already a member of "${currentGroup.groupName}". Please leave your current group or use "Change Group" to switch.`);
    }

    // Get group
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;

    // Validations
    if (groupData.status !== 'active') {
      throw new Error('This group is not accepting new members');
    }

    if (groupData.currentStudents >= groupData.maxStudents) {
      throw new Error('This group is full');
    }

    // Create membership
    const membershipData = {
      groupId: validated.groupId,
      groupName: groupData.name,
      studentId: user.uid,
      studentName: userData.displayName || userData.email,
      studentEmail: userData.email,
      joinedAt: Timestamp.now(),
      status: 'active',
      // Phase tracking fields
      phase: 'code',
      phaseUpdatedAt: Timestamp.now(),
      phaseUpdatedBy: null,
      phaseNotes: null,
      consecutiveAbsences: 0,
    };

    await adminDb.collection(COLLECTIONS.GROUP_MEMBERS).add(membershipData);

    // Update group student count
    await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).update({
      currentStudents: FieldValue.increment(1),
    });

    // Send notifications
    try {
      // Notify student
      await notifyGroupJoined(validated.groupId, user.uid, groupData.name);

      // Notify teacher
      await notifyTeacherStudentJoined(
        validated.groupId,
        groupData.teacherId,
        userData.displayName || userData.email || 'A student',
        groupData.name
      );
    } catch (notifError) {
      console.error('Error sending group join notifications:', notifError);
    }

    return {
      success: true,
      message: 'Successfully joined group',
    };
  } catch (error: unknown) {
    console.error('Error joining group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join group',
    };
  }
}

/**
 * Student: Leave a group
 */
export async function leaveGroup(groupId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    // Find membership
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('studentId', '==', user.uid)
      .where('status', '==', 'active')
      .get();

    if (membershipSnapshot.empty) {
      throw new Error('You are not a member of this group');
    }

    const membershipDoc = membershipSnapshot.docs[0];

    // Update membership status
    await membershipDoc.ref.update({
      status: 'removed',
      leftAt: Timestamp.now(),
    });

    // Update group student count
    await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).update({
      currentStudents: FieldValue.increment(-1),
    });

    return {
      success: true,
      message: 'Successfully left group',
    };
  } catch (error: unknown) {
    console.error('Error leaving group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to leave group',
    };
  }
}

/**
 * Student: Change from one group to another (atomic operation)
 */
export async function changeGroup(
  currentGroupId: string, 
  newGroupId: string, 
  reason: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Please provide a reason for changing groups (minimum 10 characters)');
    }

    // Get current group membership
    const currentMembershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', user.uid)
      .where('groupId', '==', currentGroupId)
      .where('status', '==', 'active')
      .get();

    if (currentMembershipSnapshot.empty) {
      throw new Error('You are not a member of the current group');
    }

    const currentMembership = currentMembershipSnapshot.docs[0];
    const currentMembershipData = currentMembership.data();

    // Get current group details for teacher notification
    const currentGroupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(currentGroupId).get();
    const currentGroupData = currentGroupDoc.exists ? currentGroupDoc.data()! : null;

    // Get new group details
    const newGroupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(newGroupId).get();
    if (!newGroupDoc.exists) {
      throw new Error('Requested group not found');
    }

    const newGroupData = newGroupDoc.data()!;

    // Check new group capacity
    if (newGroupData.currentStudents >= newGroupData.maxStudents) {
      throw new Error(`Cannot join "${newGroupData.name}": group is full`);
    }

    // Check new group status
    if (newGroupData.status !== 'active') {
      throw new Error('Requested group is not accepting new members');
    }

    // Get user data for notifications
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userData = userDoc.data()!;

    // Execute the change atomically
    const batch = adminDb.batch();

    // 1. Remove from current group (mark as changed, not removed)
    batch.update(currentMembership.ref, {
      status: 'changed',
      leftAt: Timestamp.now(),
      changeReason: reason.trim(),
      changedToGroupId: newGroupId,
      changedToGroupName: newGroupData.name,
    });

    // 2. Decrement current group count
    batch.update(adminDb.collection(COLLECTIONS.GROUPS).doc(currentGroupId), {
      currentStudents: FieldValue.increment(-1),
    });

    // 3. Add to new group
    const newMembershipRef = adminDb.collection(COLLECTIONS.GROUP_MEMBERS).doc();
    batch.set(newMembershipRef, {
      groupId: newGroupId,
      groupName: newGroupData.name,
      studentId: user.uid,
      studentName: userData.displayName || userData.email,
      studentEmail: userData.email,
      joinedAt: Timestamp.now(),
      status: 'active',
      changedFromGroupId: currentGroupId,
      changedFromGroupName: currentMembershipData.groupName,
      changeReason: reason.trim(),
      // Phase tracking fields - reset to code on group change
      phase: 'code',
      phaseUpdatedAt: Timestamp.now(),
      phaseUpdatedBy: null,
      phaseNotes: null,
      consecutiveAbsences: 0,
    });

    // 4. Increment new group count
    batch.update(adminDb.collection(COLLECTIONS.GROUPS).doc(newGroupId), {
      currentStudents: FieldValue.increment(1),
    });

    await batch.commit();

    // Send notifications (don't fail if notifications fail)
    try {
      // Notify student about both groups
      await notifyGroupRemoved(currentGroupId, user.uid, currentMembershipData.groupName);
      await notifyGroupJoined(newGroupId, user.uid, newGroupData.name);
      
      // Notify old teacher
      if (currentGroupData?.teacherId) {
        await notifyTeacherStudentLeft(
          currentGroupId,
          currentGroupData.teacherId,
          userData.displayName || userData.email || 'A student',
          currentMembershipData.groupName
        );
      }
      
      // Notify new teacher
      if (newGroupData.teacherId) {
        await notifyTeacherStudentJoined(
          newGroupId,
          newGroupData.teacherId,
          userData.displayName || userData.email || 'A student',
          newGroupData.name
        );
      }
    } catch (notifError) {
      console.error('Error sending group change notifications:', notifError);
    }

    return {
      success: true,
      message: `Successfully changed from "${currentMembershipData.groupName}" to "${newGroupData.name}"`,
    };

  } catch (error: unknown) {
    console.error('Error changing groups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change groups',
    };
  }
}

// ============================================================================
// TEACHER: GROUP MANAGEMENT
// ============================================================================

/**
 * Get teacher's assigned groups
 */
export async function getTeacherGroups(teacherId: string): Promise<Group[]> {
  try {
    const user = await getCurrentUser();
    const userRole = await getUserRole(user.uid);

    if (user.uid !== teacherId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUPS)
      .where('teacherId', '==', teacherId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs
      .map(doc => convertDocToPlain<Group>(doc))
      .filter((g): g is Group => g !== null);
  } catch (error) {
    console.error('Error getting teacher groups:', error);
    throw error;
  }
}

/**
 * Get group members (Teacher/Admin)
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const user = await getCurrentUser();
    
    // Verify access
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userRole = await getUserRole(user.uid);

    if (groupData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('status', '==', 'active')
      .get();

    // Sort by joinedAt in JavaScript
    const members = snapshot.docs
      .map(doc => convertDocToPlain<GroupMember>(doc))
      .filter((m): m is GroupMember => m !== null);

    return members.sort((a, b) => 
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
}

/**
 * Remove student from group (Teacher/Admin)
 */
export async function removeStudentFromGroup(groupId: string, studentId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    // Verify access
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userRole = await getUserRole(user.uid);

    if (groupData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Find membership
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .get();

    if (membershipSnapshot.empty) {
      throw new Error('Student is not a member of this group');
    }

    // Update membership
    await membershipSnapshot.docs[0].ref.update({
      status: 'removed',
      removedAt: Timestamp.now(),
      removedBy: user.uid,
    });

    // Update group count
    await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).update({
      currentStudents: FieldValue.increment(-1),
    });

    // Send notification to student
    try {
      await notifyGroupRemoved(groupId, studentId, groupData.name);
    } catch (notifError) {
      console.error('Error sending group removal notification:', notifError);
    }

    return {
      success: true,
      message: 'Student removed from group',
    };
  } catch (error: unknown) {
    console.error('Error removing student:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove student',
    };
  }
}

// ============================================================================
// GROUP SCHEDULES
// ============================================================================

/**
 * Create group schedule (Teacher/Admin)
 */
export async function createGroupSchedule(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createGroupScheduleSchema.parse(input);
    const user = await getCurrentUser();

    // Get group and verify teacher
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userRole = await getUserRole(user.uid);

    if (groupData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Only the group teacher can create schedules');
    }

    const scheduleData = {
      groupId: validated.groupId,
      groupName: groupData.name,
      teacherId: groupData.teacherId,
      teacherName: groupData.teacherName,
      lessonType: validated.lessonType,
      topic: validated.topic,
      date: Timestamp.fromDate(new Date(validated.date)),
      startTime: validated.startTime,
      endTime: validated.endTime,
      location: validated.location || null,
      notes: validated.notes || null,
      attendanceRequired: validated.attendanceRequired,
      createdAt: Timestamp.now(),
    };

    await adminDb.collection(COLLECTIONS.GROUP_SCHEDULES).add(scheduleData);

    // Send notifications to all group members
    try {
      const membersSnapshot = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('groupId', '==', validated.groupId)
        .where('status', '==', 'active')
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().studentId);

      if (memberIds.length > 0) {
        const formattedDate = new Date(validated.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });

        await notifyGroupScheduleCreated(
          validated.groupId,
          memberIds,
          groupData.teacherName,
          validated.topic,
          formattedDate
        );
      }
    } catch (notifError) {
      console.error('Error sending group schedule notifications:', notifError);
    }

    return {
      success: true,
      message: 'Group schedule created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating group schedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create schedule',
    };
  }
}

/**
 * Get group schedules
 */
export async function getGroupSchedules(groupId: string): Promise<GroupSchedule[]> {
  try {
    const user = await getCurrentUser();

    // Verify access
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userRole = await getUserRole(user.uid);

    // Check if user is teacher, admin, or group member
    let hasAccess = false;
    
    if (userRole === 'admin' || groupData.teacherId === user.uid) {
      hasAccess = true;
    } else if (userRole === 'student') {
      const membershipSnapshot = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('groupId', '==', groupId)
        .where('studentId', '==', user.uid)
        .where('status', '==', 'active')
        .get();
      
      hasAccess = !membershipSnapshot.empty;
    }

    if (!hasAccess) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUP_SCHEDULES)
      .where('groupId', '==', groupId)
      .get();

    const schedules = snapshot.docs
      .map(doc => convertDocToPlain<GroupSchedule>(doc))
      .filter((s): s is GroupSchedule => s !== null);

    // Sort by date descending
    return schedules.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error getting group schedules:', error);
    throw error;
  }
}

/**
 * Delete group schedule (Teacher/Admin)
 */
export async function deleteGroupSchedule(scheduleId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    const scheduleDoc = await adminDb.collection(COLLECTIONS.GROUP_SCHEDULES).doc(scheduleId).get();
    if (!scheduleDoc.exists) {
      throw new Error('Schedule not found');
    }

    const scheduleData = scheduleDoc.data()!;
    const userRole = await getUserRole(user.uid);
    
    if (scheduleData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    await scheduleDoc.ref.delete();

    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting schedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete schedule',
    };
  }
}

// ============================================================================
// GROUP RESOURCES
// ============================================================================

/**
 * Create group resource (Teacher/Admin)
 * Supports: library-reference, quiz-reference, external-link, uploaded-file
 */
export async function createGroupResource(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = createGroupResourceSchema.parse(input);
    const user = await getCurrentUser();

    // Get group and verify teacher
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const userData = userDoc.data()!;

    if (groupData.teacherId !== user.uid && userData.role !== 'admin') {
      throw new Error('Only the group teacher can add resources');
    }

    // Build base resource data
    const resourceData: Record<string, unknown> = {
      groupId: validated.groupId,
      groupName: groupData.name,
      teacherId: user.uid,
      teacherName: userData.displayName || userData.email,
      title: validated.title,
      description: validated.description || null,
      type: validated.type,
      uploadedAt: Timestamp.now(),
    };

    // Handle different resource types
    if (validated.type === 'library-reference') {
      // Get library file details
      const libraryDoc = await adminDb.collection(COLLECTIONS.LIBRARY).doc(validated.libraryFileId!).get();
      if (!libraryDoc.exists) {
        throw new Error('Library file not found');
      }
      
      const libraryData = libraryDoc.data()!;
      resourceData.libraryFileId = validated.libraryFileId;
      resourceData.libraryFileName = libraryData.originalName || libraryData.fileName;
      resourceData.libraryFileUrl = libraryData.downloadUrl;
      resourceData.libraryCategory = libraryData.category;
      
    } else if (validated.type === 'quiz-reference') {
      // Get quiz details
      const quizDoc = await adminDb.collection(COLLECTIONS.QUIZZES).doc(validated.quizId!).get();
      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }
      
      const quizData = quizDoc.data()!;
      
      // Handle multilingual title
      let quizTitle = 'Quiz';
      if (typeof quizData.title === 'object' && quizData.title !== null) {
        quizTitle = quizData.title.en || quizData.title.fr || quizData.title.ar || 'Quiz';
      } else if (typeof quizData.title === 'string') {
        quizTitle = quizData.title;
      }
      
      resourceData.quizId = validated.quizId;
      resourceData.quizTitle = quizTitle;
      resourceData.quizQuestionCount = quizData.questionCount || 0;
      
    } else if (validated.type === 'external-link') {
      resourceData.externalUrl = validated.externalUrl;
      
    } else if (validated.type === 'uploaded-file') {
      resourceData.fileUrl = validated.fileUrl;
      resourceData.fileName = validated.fileName;
      resourceData.fileSize = validated.fileSize || null;
    }

    await adminDb.collection(COLLECTIONS.GROUP_RESOURCES).add(resourceData);

    // Send notifications to all group members
    try {
      const membersSnapshot = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('groupId', '==', validated.groupId)
        .where('status', '==', 'active')
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().studentId);

      if (memberIds.length > 0) {
        await notifyGroupResourceAdded(
          validated.groupId,
          memberIds,
          userData.displayName || userData.email || 'A teacher',
          validated.title
        );
      }
    } catch (notifError) {
      console.error('Error sending group resource notifications:', notifError);
    }

    return {
      success: true,
      message: 'Resource added successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add resource',
    };
  }
}

/**
 * Get group resources
 */
export async function getGroupResources(groupId: string): Promise<GroupResource[]> {
  try {
    const user = await getCurrentUser();

    // Verify access (same as schedules)
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data()!;
    const userRole = await getUserRole(user.uid);

    let hasAccess = false;
    
    if (userRole === 'admin' || groupData.teacherId === user.uid) {
      hasAccess = true;
    } else if (userRole === 'student') {
      const membershipSnapshot = await adminDb
        .collection(COLLECTIONS.GROUP_MEMBERS)
        .where('groupId', '==', groupId)
        .where('studentId', '==', user.uid)
        .where('status', '==', 'active')
        .get();
      
      hasAccess = !membershipSnapshot.empty;
    }

    if (!hasAccess) {
      throw new Error('Unauthorized');
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.GROUP_RESOURCES)
      .where('groupId', '==', groupId)
      .get();

    const resources = snapshot.docs
      .map(doc => convertDocToPlain<GroupResource>(doc))
      .filter((r): r is GroupResource => r !== null);

    // Sort by uploadedAt descending
    return resources.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting resources:', error);
    throw error;
  }
}

/**
 * Delete group resource (Teacher/Admin)
 */
export async function deleteGroupResource(resourceId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    const resourceDoc = await adminDb.collection(COLLECTIONS.GROUP_RESOURCES).doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new Error('Resource not found');
    }

    const resourceData = resourceDoc.data()!;
    const userRole = await getUserRole(user.uid);
    
    if (resourceData.teacherId !== user.uid && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    await resourceDoc.ref.delete();

    return {
      success: true,
      message: 'Resource deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Error deleting resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete resource',
    };
  }
}

// ============================================================================
// ADMIN: ADD/REMOVE STUDENTS FROM GROUPS
// ============================================================================

import { z } from 'zod';
import { createNotification } from './notifications';

const adminAddStudentSchema = z.object({
  groupId: z.string().min(1),
  studentId: z.string().min(1),
});

const adminRemoveStudentSchema = z.object({
  groupId: z.string().min(1),
  studentId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

/**
 * Admin: Add a student to a group
 */
export async function adminAddStudentToGroup(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = adminAddStudentSchema.parse(input);
    const user = await getCurrentUser();

    // Admin only
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can add students to groups');
    }

    // 1. Verify group exists
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }
    const groupData = groupDoc.data()!;

    // 2. Verify student exists and has role "student"
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
      return { success: false, error: 'Student not found' };
    }
    const studentData = studentDoc.data()!;

    // 3. One-group limit check
    const existingMembership = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('studentId', '==', validated.studentId)
      .where('status', '==', 'active')
      .get();

    if (!existingMembership.empty) {
      const currentMembership = existingMembership.docs[0].data();
      // Get the group name
      const currentGroupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(currentMembership.groupId).get();
      const currentGroupName = currentGroupDoc.exists ? currentGroupDoc.data()?.name : 'another group';
      return { 
        success: false, 
        error: `Student is already in "${currentGroupName}". Remove them first.` 
      };
    }

    // 4. Capacity check
    if (groupData.currentStudents >= groupData.maxStudents) {
      return { 
        success: false, 
        error: `Group is full (max ${groupData.maxStudents} students)` 
      };
    }

    // 5. Create groupMembers document
    const membershipData = {
      groupId: validated.groupId,
      groupName: groupData.name,
      studentId: validated.studentId,
      studentName: studentData.displayName || studentData.email,
      studentEmail: studentData.email,
      status: 'active',
      joinedAt: Timestamp.now(),
      phase: 'code',
      phaseUpdatedAt: Timestamp.now(),
      phaseUpdatedBy: null,
      phaseNotes: null,
      consecutiveAbsences: 0,
    };

    await adminDb.collection(COLLECTIONS.GROUP_MEMBERS).add(membershipData);

    // 6. Update group document — increment currentStudents
    await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).update({
      currentStudents: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });

    // 7. Notify student
    try {
      await createNotification({
        userId: validated.studentId,
        type: 'group_joined',
        priority: 'normal',
        title: '👥 Added to Group',
        message: `You have been added to ${groupData.name} by an administrator.`,
        actionUrl: `/student/groups/${validated.groupId}`,
        actionLabel: 'View Group',
        metadata: { groupId: validated.groupId },
      });
    } catch (notifError) {
      console.error('Error sending student notification:', notifError);
    }

    // 8. Notify group teacher
    try {
      await createNotification({
        userId: groupData.teacherId,
        type: 'group_student_joined',
        priority: 'normal',
        title: '👥 Student Added',
        message: `${studentData.displayName || studentData.email} has been added to your group ${groupData.name} by an administrator.`,
        actionUrl: `/teacher/groups/${validated.groupId}`,
        actionLabel: 'View Group',
        metadata: { groupId: validated.groupId, studentId: validated.studentId },
      });
    } catch (notifError) {
      console.error('Error sending teacher notification:', notifError);
    }

    return {
      success: true,
      message: `${studentData.displayName || studentData.email} added to ${groupData.name}`,
    };
  } catch (error: unknown) {
    console.error('Error adding student to group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add student to group',
    };
  }
}

/**
 * Admin: Remove a student from a group
 */
export async function adminRemoveStudentFromGroup(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = adminRemoveStudentSchema.parse(input);
    const user = await getCurrentUser();

    // Admin only
    if (!await isAdmin(user.uid)) {
      throw new Error('Only admins can remove students from groups');
    }

    // 1. Find the groupMembers document
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', validated.groupId)
      .where('studentId', '==', validated.studentId)
      .where('status', '==', 'active')
      .get();

    if (membershipSnapshot.empty) {
      return { success: false, error: 'Student is not currently in this group' };
    }

    const membershipDoc = membershipSnapshot.docs[0];

    // 2. Read the group to get groupName and teacherId
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }
    const groupData = groupDoc.data()!;

    // 3. Read the user to get studentName
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    const studentName = studentDoc.exists 
      ? (studentDoc.data()?.displayName || studentDoc.data()?.email || 'Student')
      : 'Student';

    // 4. Update groupMembers document
    await membershipDoc.ref.update({
      status: 'removed',
      leftAt: Timestamp.now(),
      removalReason: validated.reason,
    });

    // 5. Update group document — decrement currentStudents
    await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).update({
      currentStudents: FieldValue.increment(-1),
      updatedAt: Timestamp.now(),
    });

    // 6. Notify student
    try {
      await createNotification({
        userId: validated.studentId,
        type: 'group_removed',
        priority: 'high',
        title: '🚪 Removed from Group',
        message: `You have been removed from ${groupData.name}. Reason: ${validated.reason}`,
        actionUrl: '/student/groups',
        actionLabel: 'View Groups',
        metadata: { groupId: validated.groupId, reason: validated.reason },
      });
    } catch (notifError) {
      console.error('Error sending student notification:', notifError);
    }

    // 7. Notify group teacher
    try {
      await createNotification({
        userId: groupData.teacherId,
        type: 'group_student_left',
        priority: 'normal',
        title: '🚪 Student Removed',
        message: `${studentName} has been removed from your group ${groupData.name}. Reason: ${validated.reason}`,
        actionUrl: `/teacher/groups/${validated.groupId}`,
        actionLabel: 'View Group',
        metadata: { groupId: validated.groupId, studentId: validated.studentId, reason: validated.reason },
      });
    } catch (notifError) {
      console.error('Error sending teacher notification:', notifError);
    }

    return {
      success: true,
      message: `${studentName} removed from ${groupData.name}`,
    };
  } catch (error: unknown) {
    console.error('Error removing student from group:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove student from group',
    };
  }
}

// ============================================================================
// LEARNING PHASE SYSTEM
// ============================================================================

const updatePhaseSchema = z.object({
  groupId: z.string().min(1),
  studentId: z.string().min(1),
  newPhase: z.enum(['creneau', 'conduite', 'exam-preparation']),
  notes: z.string().min(5, 'Notes must be at least 5 characters'),
});

import { PHASE_LABELS, ALLOWED_TRANSITIONS } from '@/lib/utils/constants/phases';

/**
 * Update a student's learning phase
 * Admin or group teacher only
 */
export async function updateStudentPhase(input: unknown): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = updatePhaseSchema.parse(input);
    const user = await getCurrentUser();

    // Get the group to check teacher ownership
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(validated.groupId).get();
    if (!groupDoc.exists) {
      return { success: false, error: 'Group not found' };
    }
    const groupData = groupDoc.data()!;

    // Permission check: admin OR group's teacher
    const userRole = await getUserRole(user.uid);
    const isGroupTeacher = groupData.teacherId === user.uid;
    
    if (userRole !== 'admin' && !isGroupTeacher) {
      return { success: false, error: 'Permission denied. Only admins or the group teacher can update phases.' };
    }

    // 1. Find groupMembers document
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', validated.groupId)
      .where('studentId', '==', validated.studentId)
      .where('status', '==', 'active')
      .get();

    if (membershipSnapshot.empty) {
      return { success: false, error: 'Student is not in this group' };
    }

    const membershipDoc = membershipSnapshot.docs[0];
    const membershipData = membershipDoc.data();
    const currentPhase = membershipData.phase || 'code';

    // 2. Validate the transition
    const allowedNextPhase = ALLOWED_TRANSITIONS[currentPhase];
    
    if (allowedNextPhase !== validated.newPhase) {
      const currentLabel = PHASE_LABELS[currentPhase] || currentPhase;
      const nextLabel = allowedNextPhase ? PHASE_LABELS[allowedNextPhase] : 'none';
      return { 
        success: false, 
        error: `Invalid transition. Current phase is "${currentLabel}". Next allowed phase is "${nextLabel}".` 
      };
    }

    // 3. Get student name for response
    const studentDoc = await adminDb.collection(COLLECTIONS.USERS).doc(validated.studentId).get();
    const studentName = studentDoc.exists 
      ? (studentDoc.data()?.displayName || studentDoc.data()?.email || 'Student')
      : 'Student';

    // 4. Update groupMembers document
    await membershipDoc.ref.update({
      phase: validated.newPhase,
      phaseUpdatedAt: Timestamp.now(),
      phaseUpdatedBy: user.uid,
      phaseNotes: validated.notes,
    });

    // 5. Notify student
    try {
      const newPhaseLabel = PHASE_LABELS[validated.newPhase] || validated.newPhase;
      await createNotification({
        userId: validated.studentId,
        type: 'group_joined', // Using existing type
        priority: 'normal',
        title: '📈 Phase Updated',
        message: `Your phase has been updated to "${newPhaseLabel}". Teacher note: ${validated.notes}`,
        actionUrl: `/student/groups/${validated.groupId}`,
        actionLabel: 'View Group',
        metadata: { 
          groupId: validated.groupId, 
          newPhase: validated.newPhase,
          previousPhase: currentPhase,
        },
      });
    } catch (notifError) {
      console.error('Error sending phase update notification:', notifError);
    }

    const newPhaseLabel = PHASE_LABELS[validated.newPhase] || validated.newPhase;
    return {
      success: true,
      message: `Phase updated to "${newPhaseLabel}" for ${studentName}`,
    };
  } catch (error: unknown) {
    console.error('Error updating student phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update phase',
    };
  }
}
