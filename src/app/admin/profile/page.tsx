/**
 * Admin Profile Page
 * View and manage admin profile
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUserProfile } from '@/lib/server/actions/profile';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import type { UserProfile } from '@/lib/types/user';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'password' | 'picture'>('view');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleSuccess() {
    loadProfile();
    setActiveTab('view');
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'view'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          View Profile
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'edit'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('picture')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'picture'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Profile Picture
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'password'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Change Password
        </button>
      </div>

      {/* Content */}
      {activeTab === 'view' && <ProfileDisplay profile={profile} />}
      {activeTab === 'edit' && <ProfileEditForm profile={profile} onSuccess={handleSuccess} />}
      {activeTab === 'picture' && (
        <ProfilePictureUpload 
          currentPictureUrl={profile.profilePictureUrl} 
          onSuccess={handleSuccess} 
        />
      )}
      {activeTab === 'password' && <ChangePasswordForm userEmail={profile.email} />}
    </div>
  );
}
