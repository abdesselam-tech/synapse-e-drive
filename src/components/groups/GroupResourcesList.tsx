/**
 * Group Resources List Component
 * Displays group resources with different types: library, quiz, link, uploaded file
 */

'use client';

import { useState } from 'react';
import { deleteGroupResource } from '@/lib/server/actions/groups';
import type { GroupResource, GroupResourceType } from '@/lib/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GroupResourceUpload from './GroupResourceUpload';

interface GroupResourcesListProps {
  resources: GroupResource[];
  groupId: string;
  onUpdated?: () => void;
  canManage?: boolean;
}

export default function GroupResourcesList({ 
  resources, 
  groupId, 
  onUpdated,
  canManage = true 
}: GroupResourcesListProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleDelete(resourceId: string) {
    if (!confirm('Delete this resource?')) return;

    setDeleting(resourceId);
    const result = await deleteGroupResource(resourceId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Resource deleted' });
      if (onUpdated) onUpdated();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' });
    }

    setDeleting(null);
  }

  function getTypeIcon(type: GroupResourceType | string): string {
    const icons: Record<string, string> = {
      'library-reference': '📚',
      'quiz-reference': '📝',
      'external-link': '🔗',
      'uploaded-file': '📄',
      // Legacy types (for backward compatibility)
      'document': '📄',
      'video': '🎬',
      'quiz': '📝',
      'link': '🔗',
      'other': '📦',
    };
    return icons[type] || '📎';
  }

  function getTypeLabel(type: GroupResourceType | string): string {
    const labels: Record<string, string> = {
      'library-reference': 'Library Files',
      'quiz-reference': 'Quizzes',
      'external-link': 'External Links',
      'uploaded-file': 'Uploaded Files',
      // Legacy types
      'document': 'Documents',
      'video': 'Videos',
      'quiz': 'Quizzes',
      'link': 'Links',
      'other': 'Other',
    };
    return labels[type] || 'Resources';
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  function formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  // Group resources by type
  const groupedResources = resources.reduce((acc, resource) => {
    const type = resource.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, GroupResource[]>);

  // Render resource action based on type
  function renderResourceAction(resource: GroupResource) {
    switch (resource.type) {
      case 'library-reference':
        return resource.libraryFileUrl ? (
          <a 
            href={resource.libraryFileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View File →
          </a>
        ) : null;

      case 'quiz-reference':
        return resource.quizId ? (
          <a 
            href={`/student/quizzes/take/${resource.quizId}`}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Take Quiz ({resource.quizQuestionCount || 0} questions) →
          </a>
        ) : null;

      case 'external-link':
        return resource.externalUrl ? (
          <a 
            href={resource.externalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Open Link →
          </a>
        ) : null;

      case 'uploaded-file':
        return resource.fileUrl ? (
          <a 
            href={resource.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Download {resource.fileSize ? `(${formatFileSize(resource.fileSize)})` : ''} →
          </a>
        ) : null;

      // Legacy support
      default:
        if (resource.externalUrl) {
          return (
            <a 
              href={resource.externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Open →
            </a>
          );
        }
        if (resource.fileUrl) {
          return (
            <a 
              href={resource.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Download →
            </a>
          );
        }
        return null;
    }
  }

  // Render extra info based on type
  function renderResourceMeta(resource: GroupResource) {
    switch (resource.type) {
      case 'library-reference':
        return resource.libraryCategory ? (
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {resource.libraryCategory}
          </span>
        ) : null;

      case 'quiz-reference':
        return (
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
            {resource.quizQuestionCount || 0} questions
          </span>
        );

      case 'uploaded-file':
        return resource.fileSize ? (
          <span className="text-xs text-gray-500">
            {formatFileSize(resource.fileSize)}
          </span>
        ) : null;

      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Add Resource Button */}
      {canManage && (
        <Button onClick={() => setShowUploadForm(true)} variant="outline" className="mb-4">
          + Add Resource
        </Button>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <GroupResourceUpload
          groupId={groupId}
          onSuccess={() => {
            setShowUploadForm(false);
            setMessage({ type: 'success', text: 'Resource added successfully!' });
            if (onUpdated) onUpdated();
          }}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Resources List */}
      {Object.keys(groupedResources).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedResources).map(([resourceType, typeResources]) => (
            <div key={resourceType}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                {getTypeIcon(resourceType)} {getTypeLabel(resourceType)} ({typeResources.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {typeResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title with icon */}
                          <div className="font-medium flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{getTypeIcon(resource.type)}</span>
                            <span className="truncate">{resource.title}</span>
                            {renderResourceMeta(resource)}
                          </div>
                          
                          {/* Description */}
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          )}
                          
                          {/* Action link */}
                          <div className="mt-2">
                            {renderResourceAction(resource)}
                          </div>
                          
                          {/* Meta info */}
                          <div className="text-xs text-gray-500 mt-2">
                            Added {formatDate(resource.uploadedAt)} by {resource.teacherName}
                          </div>
                        </div>
                        
                        {/* Delete button */}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(resource.id)}
                            disabled={deleting === resource.id}
                            className="text-red-600 hover:bg-red-50 flex-shrink-0"
                          >
                            {deleting === resource.id ? '...' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <p className="text-gray-600 text-lg">No resources yet</p>
            {canManage && (
              <p className="text-sm text-gray-500 mt-2">
                Add library files, quizzes, or external links for your students
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
