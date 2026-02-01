/**
 * Activity Feed Component
 * Displays group activity for cross-role presence
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { ActivityEntry, ActivityType } from '@/lib/types/activity';

interface ActivityFeedProps {
  activities: ActivityEntry[];
  title?: string;
  showGroupName?: boolean;
  maxItems?: number;
  className?: string;
  emptyMessage?: string;
}

const activityIcons: Record<ActivityType, string> = {
  booking: '📅',
  booking_cancelled: '❌',
  rank_up: '🎉',
  quiz_completed: '📝',
  resource_added: '📚',
  resource_removed: '🗑️',
  exam_form_created: '📋',
  exam_requested: '✋',
  exam_approved: '✅',
  exam_rejected: '❌',
  exam_passed: '🏆',
  exam_failed: '📉',
  student_joined: '👋',
  student_left: '👋',
  attendance_marked: '✓',
  schedule_created: '📅',
  announcement: '📢',
};

const activityColors: Record<ActivityType, string> = {
  booking: 'bg-blue-50 border-blue-200',
  booking_cancelled: 'bg-red-50 border-red-200',
  rank_up: 'bg-green-50 border-green-200',
  quiz_completed: 'bg-purple-50 border-purple-200',
  resource_added: 'bg-indigo-50 border-indigo-200',
  resource_removed: 'bg-gray-50 border-gray-200',
  exam_form_created: 'bg-amber-50 border-amber-200',
  exam_requested: 'bg-yellow-50 border-yellow-200',
  exam_approved: 'bg-green-50 border-green-200',
  exam_rejected: 'bg-red-50 border-red-200',
  exam_passed: 'bg-green-50 border-green-200',
  exam_failed: 'bg-red-50 border-red-200',
  student_joined: 'bg-blue-50 border-blue-200',
  student_left: 'bg-gray-50 border-gray-200',
  attendance_marked: 'bg-teal-50 border-teal-200',
  schedule_created: 'bg-blue-50 border-blue-200',
  announcement: 'bg-amber-50 border-amber-200',
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function ActivityItem({ 
  activity, 
  showGroupName 
}: { 
  activity: ActivityEntry; 
  showGroupName?: boolean;
}) {
  const icon = activityIcons[activity.type] || '📌';
  const colorClass = activityColors[activity.type] || 'bg-gray-50 border-gray-200';
  
  return (
    <div className={cn(
      'p-3 rounded-lg border transition-colors hover:shadow-sm',
      colorClass
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.title}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {activity.message}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{formatRelativeTime(activity.createdAt)}</span>
            {showGroupName && activity.metadata?.groupName ? (
              <>
                <span>•</span>
                <span>{String(activity.metadata.groupName)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({
  activities,
  title = 'Activité récente',
  showGroupName = false,
  maxItems = 10,
  className,
  emptyMessage = 'Aucune activité récente',
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📊</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedActivities.map((activity) => (
              <ActivityItem 
                key={activity.id} 
                activity={activity}
                showGroupName={showGroupName}
              />
            ))}
          </div>
        )}
        
        {activities.length > maxItems && (
          <p className="text-xs text-gray-500 text-center mt-3">
            +{activities.length - maxItems} autres activités
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact activity list for sidebars
 */
export function ActivityList({
  activities,
  maxItems = 5,
  className,
}: {
  activities: ActivityEntry[];
  maxItems?: number;
  className?: string;
}) {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <div className={cn('space-y-2', className)}>
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2 text-sm">
          <span className="flex-shrink-0">
            {activityIcons[activity.type] || '📌'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-700 truncate">{activity.message}</p>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
      
      {activities.length === 0 && (
        <p className="text-sm text-gray-500">Aucune activité</p>
      )}
    </div>
  );
}

export default ActivityFeed;
