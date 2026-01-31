/**
 * Teacher Schedules Client Component
 * Provides tabbed view for managing individual schedules and viewing unified schedule
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ScheduleManagerClient } from './ScheduleManagerClient';
import UnifiedScheduleView from './UnifiedScheduleView';
import type { PlainSchedule, CombinedScheduleItem } from '@/lib/server/actions/schedules';

interface TeacherSchedulesClientProps {
  initialIndividualSchedules: PlainSchedule[];
  initialCombinedSchedules: CombinedScheduleItem[];
  teacherId: string;
}

type ViewTab = 'unified' | 'manage';

export default function TeacherSchedulesClient({
  initialIndividualSchedules,
  initialCombinedSchedules,
  teacherId,
}: TeacherSchedulesClientProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('unified');
  const [combinedSchedules, setCombinedSchedules] = useState(initialCombinedSchedules);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Import dynamically to avoid server action in initial bundle
      const { getTeacherCombinedSchedule } = await import('@/lib/server/actions/schedules');
      const newSchedules = await getTeacherCombinedSchedule(teacherId);
      setCombinedSchedules(newSchedules);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
    
    // Also refresh the page for the individual schedule manager
    router.refresh();
  }, [teacherId, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Teaching Schedule</h1>
          <p className="text-gray-600 mt-1">
            Manage individual lessons and view all your teaching sessions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('unified')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'unified'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              📅 Unified Calendar
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {combinedSchedules.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              ⚙️ Manage Individual Lessons
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {initialIndividualSchedules.length}
              </span>
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'unified' ? (
        <div>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Unified View:</span> This calendar shows all your 
              teaching sessions - both individual lessons and group sessions - in one place.
            </p>
          </div>
          <UnifiedScheduleView 
            schedules={combinedSchedules} 
            onRefresh={handleRefresh} 
          />
        </div>
      ) : (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Individual Lessons:</span> Create, edit, and manage 
              your individual lesson schedules here. Students can book these sessions.
            </p>
          </div>
          <ScheduleManagerClient 
            initialSchedules={initialIndividualSchedules} 
            teacherId={teacherId} 
          />
        </div>
      )}
    </div>
  );
}
