/**
 * Teacher Schedule Filter Component
 * Allows teachers to filter their own schedules
 */

'use client';

import { useState, useEffect } from 'react';
import { filterTeacherSchedules, getUniqueLessonTypes, type PlainSchedule } from '@/lib/server/actions/schedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TeacherScheduleFilterProps {
  teacherId: string;
  onFilteredSchedules: (schedules: PlainSchedule[]) => void;
}

export default function TeacherScheduleFilter({ 
  teacherId,
  onFilteredSchedules 
}: TeacherScheduleFilterProps) {
  const [lessonTypes, setLessonTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lessonType, setLessonType] = useState('');
  const [status, setStatus] = useState<'available' | 'full' | 'all'>('all');

  useEffect(() => {
    loadLessonTypes();
  }, []);

  async function loadLessonTypes() {
    const types = await getUniqueLessonTypes();
    setLessonTypes(types);
  }

  async function handleFilter() {
    setLoading(true);
    try {
      const results = await filterTeacherSchedules(teacherId, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        lessonType: lessonType || undefined,
        status,
      });
      onFilteredSchedules(results);
    } catch (error) {
      console.error('Error filtering schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleClearFilters() {
    setDateFrom('');
    setDateTo('');
    setLessonType('');
    setStatus('all');
  }

  function getLessonTypeLabel(type: string) {
    const labels: Record<string, string> = {
      theoretical: 'Theory',
      practical: 'Practical',
      exam_prep: 'Exam Prep',
    };
    return labels[type] || type;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-lg">Filter Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <Label htmlFor="dateFrom" className="text-sm">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="dateTo" className="text-sm">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="lessonType" className="text-sm">Lesson Type</Label>
            <select
              id="lessonType"
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value)}
              className="w-full h-9 px-3 border rounded-md text-sm"
            >
              <option value="">All Types</option>
              {lessonTypes.map(type => (
                <option key={type} value={type}>{getLessonTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status" className="text-sm">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'available' | 'full' | 'all')}
              className="w-full h-9 px-3 border rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFilter} disabled={loading} size="sm">
            {loading ? 'Filtering...' : 'Apply Filters'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleClearFilters();
              setTimeout(handleFilter, 100);
            }}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
