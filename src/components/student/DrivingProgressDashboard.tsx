'use client';

import { MIN_HOURS_FOR_EXAM } from '@/lib/utils/constants/lessonTypes';
import type { StudentProgress } from '@/lib/types/booking';

interface DrivingProgressDashboardProps {
  progress: StudentProgress;
}

export default function DrivingProgressDashboard({ progress }: DrivingProgressDashboardProps) {
  const hoursRemaining = Math.max(0, MIN_HOURS_FOR_EXAM - progress.totalHours);
  const progressPercentage = Math.min(100, (progress.totalHours / MIN_HOURS_FOR_EXAM) * 100);

  function formatLastLesson(dateString: string | null): string {
    if (!dateString) return 'No lessons yet';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    return '⭐'.repeat(fullStars) + (halfStar ? '✨' : '');
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Driving Progress</h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-4xl font-bold text-blue-600">{progress.totalHours}</div>
          <div className="text-sm text-blue-800 font-medium">Hours Completed</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="text-4xl font-bold text-green-600">{progress.totalLessons}</div>
          <div className="text-sm text-green-800 font-medium">Lessons Taken</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">
            {progress.averageRating > 0 ? progress.averageRating.toFixed(1) : '-'}
            {progress.averageRating > 0 && <span className="text-2xl ml-1">⭐</span>}
          </div>
          <div className="text-sm text-yellow-800 font-medium">Average Rating</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-4xl font-bold text-purple-600">{hoursRemaining}</div>
          <div className="text-sm text-purple-800 font-medium">Hours Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Progress to Exam Eligibility</span>
          <span className="text-sm font-bold text-gray-900">
            {progress.totalHours}/{MIN_HOURS_FOR_EXAM} hours
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
          <div
            className={`h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
              progressPercentage >= 100 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${Math.max(progressPercentage, 5)}%` }}
          >
            {progressPercentage >= 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(progressPercentage)}%
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Minimum {MIN_HOURS_FOR_EXAM} hours of practical driving required for exam eligibility
        </p>
      </div>

      {/* Exam Readiness Banner */}
      {progress.readyForExam ? (
        <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div>
              <div className="font-bold text-xl text-green-900">Ready for Practical Exam!</div>
              <div className="text-sm text-green-700 mt-1">
                Congratulations! You&apos;ve completed <strong>{progress.totalHours} hours</strong> of 
                practice with an average rating of <strong>{progress.averageRating}/5</strong>.
                You are now eligible to request your practical driving exam.
              </div>
              <a
                href="/student/exam-requests"
                className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Request Exam →
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📚</div>
            <div>
              <div className="font-bold text-xl text-blue-900">Keep Practicing!</div>
              <div className="text-sm text-blue-700 mt-1">
                {hoursRemaining > 0 ? (
                  <>
                    Complete <strong>{hoursRemaining} more hour{hoursRemaining !== 1 ? 's' : ''}</strong> of 
                    practice and maintain a good rating (3.5+) to become exam-ready.
                  </>
                ) : (
                  <>
                    You have enough hours! Focus on improving your rating to at least 3.5 
                    to become exam-ready.
                  </>
                )}
              </div>
              <a
                href="/student/bookings"
                className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Book a Lesson →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Top Skills */}
      {progress.topSkills.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-3">Your Strongest Skills</h3>
          <div className="flex flex-wrap gap-2">
            {progress.topSkills.map((skill, index) => (
              <span
                key={skill}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  index === 0
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {index === 0 && '🏆 '}
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lessons by Type */}
      {Object.keys(progress.bookingsByType).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Completed Lessons by Type</h3>
          <div className="space-y-2">
            {Object.entries(progress.bookingsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div 
                  key={type} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-700 font-medium">{type}</span>
                  <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-full border">
                    {count} lesson{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Last Lesson */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Last Lesson:</span>
          <span className="font-medium text-gray-900">{formatLastLesson(progress.lastLesson)}</span>
        </div>
      </div>
    </div>
  );
}
