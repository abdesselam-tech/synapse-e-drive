/**
 * File Upload Component
 * For teachers and admins to upload learning materials
 */

'use client';

import { useState } from 'react';
import { uploadFileToStorage, formatFileSize, validateFileSize } from '@/lib/utils/fileUpload';
import { saveFileMetadata } from '@/lib/server/actions/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LibraryCategory } from '@/lib/types/library';

const categories: { value: LibraryCategory; label: string }[] = [
  { value: 'road-signs', label: 'Road Signs' },
  { value: 'traffic-rules', label: 'Traffic Rules' },
  { value: 'driving-techniques', label: 'Driving Techniques' },
  { value: 'exam-prep', label: 'Exam Preparation' },
  { value: 'video-tutorials', label: 'Video Tutorials' },
  { value: 'practice-tests', label: 'Practice Tests' },
  { value: 'other', label: 'Other' },
];

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<LibraryCategory>('other');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateFileSize(selectedFile, 50)) {
      setMessage({ type: 'error', text: 'File size must be less than 50MB' });
      return;
    }

    setFile(selectedFile);
    setMessage(null);
  }

  async function handleUpload() {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setProgress(0);

    try {
      // Upload to Firebase Storage
      const { downloadUrl, storagePath } = await uploadFileToStorage(file, setProgress);

      // Save metadata to Firestore
      const result = await saveFileMetadata({
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category,
        description: description || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        isPublic,
        downloadUrl,
        storagePath,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'File uploaded successfully!' });
        // Reset form
        setFile(null);
        setCategory('other');
        setDescription('');
        setTags('');
        setIsPublic(true);
        setProgress(0);

        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        if (onUploadComplete) {
          setTimeout(onUploadComplete, 1500);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New File</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <Label htmlFor="file-input">Select File</Label>
            <Input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.webm,.mp3,.wav"
              className="mt-1"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                {file.name} ({formatFileSize(file.size)})
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Max file size: 50MB. Supported: PDF, images, videos, documents
            </p>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as LibraryCategory)}
              disabled={uploading}
              className="mt-1"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              rows={3}
              placeholder="Brief description of the file..."
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={uploading}
              placeholder="tag1, tag2, tag3"
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={uploading}
              className="h-4 w-4"
            />
            <Label htmlFor="isPublic" className="text-sm cursor-pointer">
              Make this file public (visible to all students)
            </Label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? `Uploading... ${Math.round(progress)}%` : 'Upload File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
