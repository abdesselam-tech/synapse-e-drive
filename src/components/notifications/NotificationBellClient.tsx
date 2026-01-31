/**
 * Notification Bell Client Wrapper
 * Client component that fetches userId and renders NotificationBell
 */

'use client';

import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';

export default function NotificationBellClient() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserId() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const { uid } = await response.json();
          setUserId(uid);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    }

    fetchUserId();
  }, []);

  if (!userId) {
    return (
      <div className="p-2">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    );
  }

  return <NotificationBell userId={userId} />;
}
