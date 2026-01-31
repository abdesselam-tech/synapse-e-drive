/**
 * Notification Bell Component
 * Displays notification icon with unread count and dropdown
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/server/actions/notifications';
import type { Notification } from '@/lib/types/notification';
import { useRouter } from 'next/navigation';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [count, notifs] = await Promise.all([
        getUnreadCount(userId),
        getUserNotifications(userId),
      ]);
      setUnreadCount(count);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate if has action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setShowDropdown(false);
  }

  async function handleMarkAllRead() {
    setLoading(true);
    await markAllNotificationsAsRead(userId);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setLoading(false);
  }

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

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-2">🔔</div>
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 15).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium truncate ${
                              !notification.read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                            {notification.actionLabel && (
                              <span className="text-xs text-blue-600 font-medium">
                                {notification.actionLabel} →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    // Determine the correct notifications page based on current path
                    const path = window.location.pathname;
                    if (path.startsWith('/admin')) {
                      router.push('/admin/notifications');
                    } else if (path.startsWith('/teacher')) {
                      router.push('/teacher/notifications');
                    } else {
                      router.push('/student/notifications');
                    }
                    setShowDropdown(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
