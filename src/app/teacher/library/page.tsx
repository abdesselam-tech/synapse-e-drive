/**
 * Teacher Library Page
 * Teachers can upload files and manage their own uploads
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLibraryFiles } from '@/lib/server/actions/library';
import FileUpload from '@/components/library/FileUpload';
import FileList from '@/components/library/FileList';
import CategoryFilter from '@/components/library/CategoryFilter';
import { Input } from '@/components/ui/input';
import type { LibraryFile } from '@/lib/types/library';

export default function TeacherLibraryPage() {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLibraryFiles({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Library</h1>
        <p className="text-gray-600">Upload and share learning materials with your students</p>
      </div>

      {/* Upload Section */}
      <FileUpload onUploadComplete={loadFiles} />

      {/* Filters */}
      <div className="space-y-4">
        <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
        
        <Input
          type="text"
          placeholder="Search files by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Files List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Library Files {files.length > 0 && `(${files.length})`}
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading files...</p>
          </div>
        ) : (
          <FileList files={files} canManage={true} onFileDeleted={loadFiles} />
        )}
      </div>
    </div>
  );
}
