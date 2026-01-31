/**
 * Profile Picture Upload Component
 * Allows users to upload and manage their profile picture
 */

'use client';

import { useState } from 'react';
import { storage } from '@/lib/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { saveProfilePicture, deleteProfilePicture } from '@/lib/server/actions/profile';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string;
  onSuccess?: () => void;
}

export default function ProfilePictureUpload({ currentPictureUrl, onSuccess }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setProgress(0);

    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `profile-pictures/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(prog);
        },
        (error) => {
          console.error('Upload error:', error);
          setMessage({ type: 'error', text: 'Upload failed' });
          setUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          const result = await saveProfilePicture({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            downloadUrl,
            storagePath,
          });

          if (result.success) {
            setMessage({ type: 'success', text: result.message || 'Profile picture updated!' });
            if (onSuccess) {
              setTimeout(onSuccess, 1500);
            }
          } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save profile picture' });
          }

          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Remove profile picture?')) return;

    setMessage(null);
    const result = await deleteProfilePicture();

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Profile picture removed' });
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove profile picture' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {currentPictureUrl && (
          <div className="flex items-center gap-4">
            <img
              src={currentPictureUrl}
              alt="Current profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Remove Picture
            </Button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            {currentPictureUrl ? 'Change Picture' : 'Upload Picture'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Formats: JPG, PNG, GIF, WebP</p>
        </div>

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
