/**
 * Teacher Notifications Page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserNotifications } from '@/lib/server/actions/notifications';
import NotificationsList from '@/components/notifications/NotificationsList';
import type { Notification } from '@/lib/types/notification';

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      const { uid } = await response.json();
      setUserId(uid);

      const data = await getUserNotifications(uid);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with your teaching activities</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : (
        <NotificationsList 
          notifications={notifications} 
          userId={userId}
          onUpdated={loadNotifications} 
        />
      )}
    </div>
  );
}
