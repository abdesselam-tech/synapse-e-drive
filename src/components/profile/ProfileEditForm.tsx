/**
 * Profile Edit Form Component
 * Form for editing user profile information
 */

'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/server/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile } from '@/lib/types/user';

interface ProfileEditFormProps {
  profile: UserProfile;
  onSuccess?: () => void;
}

export default function ProfileEditForm({ profile, onSuccess }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  
  // Student fields
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContact?.phoneNumber || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(profile.emergencyContact?.relationship || '');
  
  // Teacher fields
  const [bio, setBio] = useState(profile.bio || '');
  const [qualifications, setQualifications] = useState<string[]>(profile.qualifications || []);
  const [newQualification, setNewQualification] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(profile.yearsOfExperience || 0);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function addQualification() {
    if (newQualification.trim()) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification('');
    }
  }

  function removeQualification(index: number) {
    setQualifications(qualifications.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const updates: Record<string, unknown> = {
      displayName,
      phoneNumber: phoneNumber || undefined,
    };

    if (profile.role === 'student' && (emergencyName || emergencyPhone || emergencyRelationship)) {
      if (emergencyName && emergencyPhone && emergencyRelationship) {
        updates.emergencyContact = {
          name: emergencyName,
          phoneNumber: emergencyPhone,
          relationship: emergencyRelationship,
        };
      }
    }

    if (profile.role === 'teacher') {
      updates.bio = bio || undefined;
      updates.qualifications = qualifications.length > 0 ? qualifications : undefined;
      updates.yearsOfExperience = yearsOfExperience || undefined;
    }

    const result = await updateProfile(updates);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Profile updated!' });
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="mt-1 bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label>Phone Number (Optional)</Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
          </div>

          {/* Student-specific fields */}
          {profile.role === 'student' && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-gray-900">Emergency Contact (Optional)</h3>
              
              <div>
                <Label>Contact Name</Label>
                <Input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Relationship</Label>
                <Input
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g., Parent, Spouse, Sibling"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Teacher-specific fields */}
          {profile.role === 'teacher' && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-gray-900">Professional Information</h3>
              
              <div>
                <Label>Bio (Optional)</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell students about yourself..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
              </div>

              <div>
                <Label>Qualifications (Optional)</Label>
                <div className="space-y-2 mt-1">
                  {qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">{qual}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQualification(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="Add qualification..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addQualification();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addQualification}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  min={0}
                  max={50}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
