'use client';

import { useState } from 'react';
import { completeBooking } from '@/lib/server/actions/bookings';
import { ALL_DRIVING_SKILLS } from '@/lib/utils/constants/lessonTypes';

interface LessonCompletionFormProps {
  booking: {
    id: string;
    studentName: string;
    lessonType: string;
    date: string;
    startTime?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LessonCompletionForm({ booking, onSuccess, onCancel }: LessonCompletionFormProps) {
  const [hoursCompleted, setHoursCompleted] = useState(2);
  const [performanceRating, setPerformanceRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [skillsImproved, setSkillsImproved] = useState<string[]>([]);
  const [areasToImprove, setAreasToImprove] = useState('');
  const [readyForNextLevel, setReadyForNextLevel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleSkill(skill: string) {
    setSkillsImproved(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (skillsImproved.length === 0) {
      setError('Please select at least one skill that the student improved');
      return;
    }

    if (!areasToImprove.trim()) {
      setError('Please provide areas for the student to improve');
      return;
    }

    setLoading(true);
    setError('');

    const result = await completeBooking({
      bookingId: booking.id,
      hoursCompleted,
      performanceRating,
      skillsImproved,
      areasToImprove: areasToImprove.trim(),
      readyForNextLevel,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Failed to complete lesson');
      setLoading(false);
    }
  }

  const ratingLabels = {
    1: 'Needs Significant Work',
    2: 'Below Average',
    3: 'Average / Satisfactory',
    4: 'Good Progress',
    5: 'Excellent',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Lesson</h2>

        {/* Booking Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Student:</span>
              <span className="ml-2 text-gray-900">{booking.studentName}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Lesson Type:</span>
              <span className="ml-2 text-gray-900">{booking.lessonType}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="ml-2 text-gray-900">{formatDate(booking.date)}</span>
              {booking.startTime && <span className="ml-2 text-gray-600">at {booking.startTime}</span>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hours Completed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Completed <span className="text-red-500">*</span>
            </label>
            <select
              value={hoursCompleted}
              onChange={(e) => setHoursCompleted(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0.5}>0.5 hours (30 min)</option>
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
              <option value={2.5}>2.5 hours</option>
              <option value={3}>3 hours</option>
            </select>
          </div>

          {/* Performance Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Performance Rating <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setPerformanceRating(rating)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    performanceRating === rating
                      ? 'border-yellow-500 bg-yellow-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl text-center">
                    {'⭐'.repeat(rating)}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center font-medium">
              {ratingLabels[performanceRating]}
            </p>
          </div>

          {/* Skills Improved */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Improved <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
              {ALL_DRIVING_SKILLS.map(skill => (
                <label
                  key={skill}
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${
                    skillsImproved.includes(skill)
                      ? 'bg-green-100 border border-green-300'
                      : 'hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={skillsImproved.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {skillsImproved.length} skill{skillsImproved.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Areas to Improve */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas to Improve <span className="text-red-500">*</span>
            </label>
            <textarea
              value={areasToImprove}
              onChange={(e) => setAreasToImprove(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe what the student should focus on in their next lesson..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This feedback will help guide the student&apos;s future practice.
            </p>
          </div>

          {/* Ready for Next Level */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="readyForNext"
              checked={readyForNextLevel}
              onChange={(e) => setReadyForNextLevel(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="readyForNext" className="cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                Student is ready to progress to the next level
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Check this if the student has mastered this lesson type and can move on to more advanced skills.
              </p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                '✓ Mark as Completed'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
