'use client';

import { useState, useEffect } from 'react';
import { createGroupResource } from '@/lib/server/actions/groups';
import { getLibraryFiles } from '@/lib/server/actions/library';
import { getQuizzes } from '@/lib/server/actions/quizzes';
import type { GroupResourceType } from '@/lib/types/group';
import type { LibraryFile } from '@/lib/types/library';
import type { Quiz as QuizType } from '@/lib/types/quiz';

interface GroupResourceUploadProps {
  groupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GroupResourceUpload({ groupId, onSuccess, onCancel }: GroupResourceUploadProps) {
  const [type, setType] = useState<GroupResourceType>('library-reference');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // For library reference
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [selectedLibraryFile, setSelectedLibraryFile] = useState('');
  
  // For quiz reference
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  
  // For external link
  const [externalUrl, setExternalUrl] = useState('');
  
  // For file upload (future feature - placeholder for now)
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  // Load library files and quizzes
  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const [libraryResult, quizzesResult] = await Promise.all([
          getLibraryFiles(),
          getQuizzes(),
        ]);
        
        setLibraryFiles(libraryResult || []);
        // Filter to only published quizzes
        setQuizzes((quizzesResult || []).filter((q: QuizType) => q.isPublished));
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setDataLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Helper to get quiz title as string
  function getQuizTitle(quiz: QuizType): string {
    if (typeof quiz.title === 'object' && quiz.title !== null) {
      return quiz.title.en || quiz.title.fr || quiz.title.ar || 'Quiz';
    }
    return String(quiz.title) || 'Quiz';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resourceData: {
        groupId: string;
        title: string;
        description?: string;
        type: GroupResourceType;
        libraryFileId?: string;
        quizId?: string;
        externalUrl?: string;
        fileUrl?: string;
        fileName?: string;
      } = {
        groupId,
        title,
        description: description || undefined,
        type,
      };

      if (type === 'library-reference') {
        if (!selectedLibraryFile) {
          throw new Error('Please select a library file');
        }
        resourceData.libraryFileId = selectedLibraryFile;
        
      } else if (type === 'quiz-reference') {
        if (!selectedQuiz) {
          throw new Error('Please select a quiz');
        }
        resourceData.quizId = selectedQuiz;
        
      } else if (type === 'external-link') {
        if (!externalUrl) {
          throw new Error('Please enter a URL');
        }
        resourceData.externalUrl = externalUrl;
        
      } else if (type === 'uploaded-file') {
        if (!fileUrl || !fileName) {
          throw new Error('Please provide file URL and name');
        }
        resourceData.fileUrl = fileUrl;
        resourceData.fileName = fileName;
      }

      const result = await createGroupResource(resourceData);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to add resource');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Auto-fill title based on selection
  useEffect(() => {
    if (type === 'library-reference' && selectedLibraryFile) {
      const file = libraryFiles.find(f => f.id === selectedLibraryFile);
      if (file && !title) setTitle(file.originalName || file.fileName);
    } else if (type === 'quiz-reference' && selectedQuiz) {
      const quiz = quizzes.find(q => q.id === selectedQuiz);
      if (quiz && !title) setTitle(getQuizTitle(quiz));
    }
  }, [type, selectedLibraryFile, selectedQuiz, libraryFiles, quizzes, title]);

  // Reset selection when type changes
  useEffect(() => {
    setSelectedLibraryFile('');
    setSelectedQuiz('');
    setExternalUrl('');
    setFileUrl('');
    setFileName('');
    setTitle('');
    setDescription('');
  }, [type]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Resource to Group</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Resource Type Tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('library-reference')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  type === 'library-reference'
                    ? 'bg-blue-50 text-blue-700 border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">📚</span>
                <span className="text-sm font-medium">Link Library File</span>
              </button>
              <button
                type="button"
                onClick={() => setType('quiz-reference')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  type === 'quiz-reference'
                    ? 'bg-blue-50 text-blue-700 border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">📝</span>
                <span className="text-sm font-medium">Link Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => setType('external-link')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  type === 'external-link'
                    ? 'bg-blue-50 text-blue-700 border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">🔗</span>
                <span className="text-sm font-medium">External Link</span>
              </button>
              <button
                type="button"
                onClick={() => setType('uploaded-file')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  type === 'uploaded-file'
                    ? 'bg-blue-50 text-blue-700 border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">📤</span>
                <span className="text-sm font-medium">Direct File URL</span>
              </button>
            </div>
          </div>

          {/* Library Reference */}
          {type === 'library-reference' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Library File <span className="text-red-500">*</span>
              </label>
              {dataLoading ? (
                <p className="text-sm text-gray-500">Loading library files...</p>
              ) : libraryFiles.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  No library files available. Upload files to the library first.
                </p>
              ) : (
                <select
                  value={selectedLibraryFile}
                  onChange={(e) => setSelectedLibraryFile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select a file --</option>
                  {libraryFiles.map(file => (
                    <option key={file.id} value={file.id}>
                      {file.originalName || file.fileName} ({file.category})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Quiz Reference */}
          {type === 'quiz-reference' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Quiz <span className="text-red-500">*</span>
              </label>
              {dataLoading ? (
                <p className="text-sm text-gray-500">Loading quizzes...</p>
              ) : quizzes.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  No published quizzes available. Create and publish a quiz first.
                </p>
              ) : (
                <select
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select a quiz --</option>
                  {quizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>
                      {getQuizTitle(quiz)} ({quiz.questions?.length || 0} questions)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* External Link */}
          {type === 'external-link' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/resource"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to external resources like YouTube videos, Google Docs, or any web resource
              </p>
            </div>
          )}

          {/* Uploaded File (Direct URL) */}
          {type === 'uploaded-file' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://storage.example.com/file.pdf"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="document.pdf"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Provide a direct link to a file hosted elsewhere (e.g., Google Drive, Dropbox)
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Resource title for students"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              maxLength={500}
              placeholder="Describe what this resource contains or how students should use it"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Resource'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
