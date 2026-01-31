/**
 * Category Filter Component
 * For filtering library files by category
 */

'use client';

import type { LibraryCategory } from '@/lib/types/library';

const categories: { value: LibraryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'road-signs', label: 'Road Signs' },
  { value: 'traffic-rules', label: 'Traffic Rules' },
  { value: 'driving-techniques', label: 'Driving Techniques' },
  { value: 'exam-prep', label: 'Exam Preparation' },
  { value: 'video-tutorials', label: 'Video Tutorials' },
  { value: 'practice-tests', label: 'Practice Tests' },
  { value: 'other', label: 'Other' },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value === 'all' ? '' : cat.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            (cat.value === 'all' && !selected) || selected === cat.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
