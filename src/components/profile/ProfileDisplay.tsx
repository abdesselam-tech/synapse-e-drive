/**
 * Profile Display Component
 * Shows user profile information
 */

'use client';

import type { UserProfile } from '@/lib/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileDisplayProps {
  profile: UserProfile;
}

export default function ProfileDisplay({ profile }: ProfileDisplayProps) {
  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-6 mb-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.displayName || 'Profile'}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500">
                {profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.displayName || 'No name set'}
              </h2>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleBadgeColor(profile.role)}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 mb-1">{profile.email}</p>
            {profile.phoneNumber && (
              <p className="text-gray-600 mb-1">📞 {profile.phoneNumber}</p>
            )}
            <p className="text-sm text-gray-500">Member since {formatDate(profile.createdAt)}</p>
          </div>
        </div>

        {/* Teacher-specific info */}
        {profile.role === 'teacher' && (
          <div className="border-t pt-4 space-y-3">
            {profile.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bio</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}
            
            {profile.qualifications && profile.qualifications.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Qualifications</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {profile.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.yearsOfExperience !== undefined && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Experience</h3>
                <p className="text-gray-700">{profile.yearsOfExperience} years</p>
              </div>
            )}

            {!profile.bio && (!profile.qualifications || profile.qualifications.length === 0) && profile.yearsOfExperience === undefined && (
              <p className="text-gray-500 italic">No professional information added yet.</p>
            )}
          </div>
        )}

        {/* Student-specific info */}
        {profile.role === 'student' && profile.emergencyContact && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Emergency Contact</h3>
            <div className="bg-gray-50 rounded-md p-3 space-y-1">
              <p className="text-gray-700"><strong>Name:</strong> {profile.emergencyContact.name}</p>
              <p className="text-gray-700"><strong>Phone:</strong> {profile.emergencyContact.phoneNumber}</p>
              <p className="text-gray-700"><strong>Relationship:</strong> {profile.emergencyContact.relationship}</p>
            </div>
          </div>
        )}

        {profile.role === 'student' && !profile.emergencyContact && (
          <div className="border-t pt-4">
            <p className="text-gray-500 italic">No emergency contact added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
