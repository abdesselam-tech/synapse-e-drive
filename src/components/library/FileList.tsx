/**
 * File List Component
 * Displays library files with download and delete functionality
 */

'use client';

import { useState } from 'react';
import { deleteLibraryFile, incrementDownloadCount } from '@/lib/server/actions/library';
import { getFileIcon, formatFileSize } from '@/lib/utils/fileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LibraryFile } from '@/lib/types/library';

interface FileListProps {
  files: LibraryFile[];
  canManage: boolean; // true for admin/teacher
  onFileDeleted?: () => void;
}

const categoryLabels: Record<string, string> = {
  'road-signs': 'Road Signs',
  'traffic-rules': 'Traffic Rules',
  'driving-techniques': 'Driving Techniques',
  'exam-prep': 'Exam Preparation',
  'video-tutorials': 'Video Tutorials',
  'practice-tests': 'Practice Tests',
  'other': 'Other',
};

export default function FileList({ files, canManage, onFileDeleted }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeletingId(fileId);
    setMessage(null);

    const result = await deleteLibraryFile({ fileId });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'File deleted!' });
      if (onFileDeleted) {
        setTimeout(onFileDeleted, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' });
    }

    setDeletingId(null);
  }

  async function handleDownload(file: LibraryFile) {
    // Increment counter
    await incrementDownloadCount(file.id);
    
    // Open in new tab
    window.open(file.downloadUrl, '_blank');
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No files available yet.</p>
          {canManage && (
            <p className="text-sm text-gray-400 mt-2">Upload your first file to get started!</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {files.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getFileIcon(file.fileType)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{file.originalName}</h3>
                      <p className="text-xs text-gray-500">
                        {categoryLabels[file.category] || file.category} • {formatFileSize(file.fileSize)} • {file.downloads} downloads
                      </p>
                    </div>
                  </div>

                  {file.description && (
                    <p className="text-sm text-gray-600 mb-2 ml-12">{file.description}</p>
                  )}

                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 ml-12">
                      {file.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 ml-12">
                    Uploaded by {file.uploadedByName} on {new Date(file.uploadedAt).toLocaleDateString()}
                    {!file.isPublic && (
                      <span className="ml-2 text-orange-600">(Private)</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => handleDownload(file)}
                    size="sm"
                  >
                    Download
                  </Button>

                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {deletingId === file.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
