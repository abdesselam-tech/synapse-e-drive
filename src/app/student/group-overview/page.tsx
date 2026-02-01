/**
 * Student Group Overview Page
 * Shows group info, activity feed, and pinned resources
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { getGroupActivity } from '@/lib/server/actions/activityFeed';
import { getPinnedResourcesForGroup } from '@/lib/server/actions/library';
import { getStudentRankInfo } from '@/lib/server/actions/ranking';
import { RankBadge, RankProgressBar } from '@/components/ui/RankBadge';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

export default async function StudentGroupOverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get student data
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      redirect('/student/dashboard');
    }

    const userData = userDoc.data()!;
    const groupId = userData.groupId;

    // If student has no group, redirect to group selection
    if (!groupId) {
      redirect('/student/groups');
    }

    // Get group data
    const groupDoc = await adminDb.collection(COLLECTIONS.GROUPS).doc(groupId).get();
    if (!groupDoc.exists) {
      redirect('/student/groups');
    }

    const groupData = groupDoc.data()!;

    // Get teacher info
    let teacherName = 'Unknown';
    if (groupData.teacherId) {
      const teacherDoc = await adminDb.collection(COLLECTIONS.USERS).doc(groupData.teacherId).get();
      if (teacherDoc.exists) {
        teacherName = teacherDoc.data()?.displayName || 'Unknown';
      }
    }

    // Get rank info
    const rankInfo = await getStudentRankInfo(decodedToken.uid);

    // Get group activity
    const activity = await getGroupActivity(groupId, 20);

    // Get pinned resources
    const pinnedResources = await getPinnedResourcesForGroup(groupId);

    // Get group member count
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.GROUP_MEMBERS)
      .where('groupId', '==', groupId)
      .where('status', '==', 'active')
      .get();
    const memberCount = membersSnapshot.size;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/student/dashboard" 
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
              >
                ← Retour au tableau de bord
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{groupData.name}</h1>
              <p className="text-gray-600">Enseignant: {teacherName}</p>
            </div>
            {rankInfo && (
              <RankBadge 
                rank={rankInfo.currentRank} 
                label={rankInfo.currentRankLabel} 
              />
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Membres</div>
              <div className="text-2xl font-bold">{memberCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Ressources Épinglées</div>
              <div className="text-2xl font-bold">{pinnedResources.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Activités Récentes</div>
              <div className="text-2xl font-bold">{activity.length}</div>
            </div>
          </div>

          {/* Rank Progress */}
          {rankInfo && rankInfo.maxRank > 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Ma Progression</h2>
              <RankProgressBar
                currentRank={rankInfo.currentRank}
                maxRank={rankInfo.maxRank}
                nextRankLabel={rankInfo.nextRankLabel}
              />
            </div>
          )}

          {/* Pinned Resources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📌 Ressources Épinglées</h2>
            {pinnedResources.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucune ressource épinglée pour ce groupe
              </p>
            ) : (
              <div className="space-y-3">
                {pinnedResources.map((resource) => (
                  <div 
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <div className="font-medium">{resource.originalName || resource.fileName}</div>
                        <div className="text-sm text-gray-500">{resource.category}</div>
                      </div>
                    </div>
                    <Link
                      href={`/student/library?resource=${resource.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Voir →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📊 Activité du Groupe</h2>
            {activity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucune activité récente dans ce groupe
              </p>
            ) : (
              <ActivityFeed activities={activity} />
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading group overview:', error);
    redirect('/student/dashboard');
  }
}
