/**
 * Notifications List Component
 * Full page view of all notifications
 */

'use client';

import { useState } from 'react';
import { markNotificationAsRead, deleteNotification, deleteAllReadNotifications } from '@/lib/server/actions/notifications';
import type { Notification } from '@/lib/types/notification';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotificationsListProps {
  notifications: Notification[];
  userId: string;
  onUpdated: () => void;
}

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsList({
  notifications: initialNotifications,
  userId,
  onUpdated,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
    setDeleting(null);
  }

  async function handleDeleteAllRead() {
    if (!confirm('Delete all read notifications?')) return;

    await deleteAllReadNotifications(userId);
    setNotifications(prev => prev.filter(n => !n.read));
    onUpdated();
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  function getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'booking_confirmed': '✅',
      'booking_cancelled': '❌',
      'booking_teacher_notes': '📝',
      'booking_reminder': '⏰',
      'group_joined': '👥',
      'group_removed': '🚪',
      'group_schedule_created': '📅',
      'group_resource_added': '📚',
      'group_student_joined': '👥',
      'group_student_left': '🚪',
      'exam_request_approved': '✅',
      'exam_request_rejected': '❌',
      'exam_request_submitted': '📝',
      'quiz_result_available': '📊',
      'quiz_published': '🆕',
      'library_file_uploaded': '📖',
      'admin_announcement': '📢',
      'user_registered': '👤',
      'system_alert': '⚠️',
    };
    return icons[type] || '🔔';
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'border-l-red-600';
      case 'high': return 'border-l-orange-500';
      case 'normal': return 'border-l-blue-500';
      default: return 'border-l-gray-300';
    }
  }

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="text-sm">
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Unread: </span>
            <span className="font-semibold text-blue-600">{stats.unread}</span>
          </div>
        </div>
        
        {stats.read > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllRead}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            Delete All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'unread'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({stats.unread})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'read'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Read ({stats.read})
        </button>
      </div>

      {/* Notifications */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">🔔</div>
            <p className="text-gray-600 text-lg">
              No {filter !== 'all' ? filter : ''} notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-semibold ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            NEW
                          </span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            HIGH
                          </span>
                        )}
                        {notification.priority === 'urgent' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(notification.createdAt)}
                      </span>
                      
                      <div className="flex gap-3">
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {notification.actionLabel || 'View'} →
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleting === notification.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deleting === notification.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
