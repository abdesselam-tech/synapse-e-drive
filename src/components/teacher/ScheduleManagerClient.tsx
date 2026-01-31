/**
 * Schedule Manager Client Wrapper
 * Handles refresh, state management, and filtering
 */

'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ScheduleManager } from './ScheduleManager';
import TeacherScheduleFilter from '@/components/schedules/TeacherScheduleFilter';
import { Button } from '@/components/ui/button';
import type { PlainSchedule } from '@/lib/server/actions/schedules';

interface ScheduleManagerClientProps {
  initialSchedules: PlainSchedule[];
  teacherId?: string;
}

export function ScheduleManagerClient({ initialSchedules, teacherId }: ScheduleManagerClientProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState<PlainSchedule[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleFilteredSchedules = useCallback((filtered: PlainSchedule[]) => {
    setFilteredSchedules(filtered);
    setIsFiltered(true);
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilteredSchedules([]);
    setIsFiltered(false);
  }, []);

  // Use filtered schedules if filters are applied
  const displaySchedules = isFiltered ? filteredSchedules : schedules;

  // Get teacherId from the first schedule if not provided
  const effectiveTeacherId = teacherId || (schedules.length > 0 ? schedules[0].teacherId : '');

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          size="sm"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleClearFilter}
            size="sm"
          >
            Clear Filter ({filteredSchedules.length} results)
          </Button>
        )}
      </div>

      {/* Filter Component */}
      {showFilters && effectiveTeacherId && (
        <TeacherScheduleFilter
          teacherId={effectiveTeacherId}
          onFilteredSchedules={handleFilteredSchedules}
        />
      )}

      {/* Schedule Manager */}
      <ScheduleManager
        schedules={displaySchedules}
        onRefresh={handleRefresh}
        isRefreshing={isPending}
      />
    </div>
  );
}
