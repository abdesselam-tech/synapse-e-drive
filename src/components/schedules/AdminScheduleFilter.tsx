/**
 * Admin Schedule Filter Component
 * Advanced filtering for all schedules
 */

'use client';

import { useState, useEffect } from 'react';
import { adminFilterSchedules, getAllTeachers, getUniqueLessonTypes, getUniqueLocations, type PlainSchedule } from '@/lib/server/actions/schedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminScheduleFilterProps {
  onFilteredSchedules: (schedules: PlainSchedule[]) => void;
}

type StatusType = 'available' | 'full' | 'past' | 'upcoming' | 'all';

export default function AdminScheduleFilter({ 
  onFilteredSchedules 
}: AdminScheduleFilterProps) {
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [lessonTypes, setLessonTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [teacherName, setTeacherName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [lessonType, setLessonType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<StatusType>('upcoming');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  async function loadFilterOptions() {
    try {
      const [teachersData, types, locs] = await Promise.all([
        getAllTeachers(),
        getUniqueLessonTypes(),
        getUniqueLocations(),
      ]);
      setTeachers(teachersData);
      setLessonTypes(types);
      setLocations(locs);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  async function handleFilter() {
    setLoading(true);
    try {
      const results = await adminFilterSchedules({
        teacherName: teacherName || undefined,
        teacherId: teacherId || undefined,
        lessonType: lessonType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        location: location || undefined,
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
    setTeacherName('');
    setTeacherId('');
    setLessonType('');
    setDateFrom('');
    setDateTo('');
    setLocation('');
    setStatus('upcoming');
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
        <CardTitle className="text-lg">Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* Teacher Name Search */}
          <div>
            <Label htmlFor="teacherName" className="text-sm">Teacher Name</Label>
            <Input
              id="teacherName"
              type="text"
              value={teacherName}
              onChange={(e) => {
                setTeacherName(e.target.value);
                setTeacherId(''); // Clear dropdown when typing
              }}
              placeholder="Search..."
              className="h-9"
            />
          </div>

          {/* Teacher Dropdown */}
          <div>
            <Label htmlFor="teacherId" className="text-sm">Or Select Teacher</Label>
            <select
              id="teacherId"
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                setTeacherName(''); // Clear search when selecting
              }}
              className="w-full h-9 px-3 border rounded-md text-sm"
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>

          {/* Lesson Type */}
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

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm">Location</Label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-9 px-3 border rounded-md text-sm"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
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

          {/* Date To */}
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

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-sm">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusType)}
              className="w-full h-9 px-3 border rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
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
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
