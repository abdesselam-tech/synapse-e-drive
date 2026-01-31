/**
 * Schedule Calendar Component
 * Weekly calendar view for displaying schedules
 */

'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlainSchedule } from '@/lib/server/actions/schedules';

interface ScheduleCalendarProps {
  schedules: PlainSchedule[];
  onScheduleClick?: (schedule: PlainSchedule) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const LESSON_TYPE_COLORS = {
  theoretical: 'bg-blue-100 border-blue-300 text-blue-800',
  practical: 'bg-green-100 border-green-300 text-green-800',
  exam_prep: 'bg-purple-100 border-purple-300 text-purple-800',
};

const LESSON_TYPE_LABELS = {
  theoretical: 'Theory',
  practical: 'Practical',
  exam_prep: 'Exam Prep',
};

export function ScheduleCalendar({
  schedules,
  onScheduleClick,
  onTimeSlotClick,
}: ScheduleCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper to convert ISO string to Date
  const timestampToDate = (timestamp: string): Date => {
    return new Date(timestamp);
  };

  // Group schedules by date and time
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, PlainSchedule[]> = {};

    schedules.forEach((schedule) => {
      const scheduleDate = timestampToDate(schedule.date);
      const dateKey = format(scheduleDate, 'yyyy-MM-dd');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(schedule);
    });

    // Sort schedules by start time within each day
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const [bHour, bMin] = b.startTime.split(':').map(Number);
        return aHour * 60 + aMin - (bHour * 60 + bMin);
      });
    });

    return grouped;
  }, [schedules]);

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const getSchedulesForDay = (date: Date): PlainSchedule[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return schedulesByDate[dateKey] || [];
  };

  const getScheduleAtTime = (date: Date, time: string): PlainSchedule | undefined => {
    const daySchedules = getSchedulesForDay(date);
    return daySchedules.find((schedule) => {
      const [scheduleStartHour, scheduleStartMin] = schedule.startTime.split(':').map(Number);
      const [timeHour, timeMin] = time.split(':').map(Number);
      const scheduleStart = scheduleStartHour * 60 + scheduleStartMin;
      const timeSlot = timeHour * 60 + timeMin;

      return scheduleStart === timeSlot;
    });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 font-medium text-sm">Time</div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-l ${
                  isSameDay(day, new Date()) ? 'bg-blue-50 font-semibold' : ''
                }`}
              >
                <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                <div className="text-sm">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="border">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-xs text-muted-foreground border-r">
                  {time}
                </div>
                {weekDays.map((day) => {
                  const scheduleAtTime = getScheduleAtTime(day, time);
                  return (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      className="p-1 border-l min-h-[60px] cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (scheduleAtTime && onScheduleClick) {
                          onScheduleClick(scheduleAtTime);
                        } else if (onTimeSlotClick) {
                          onTimeSlotClick(day, time);
                        }
                      }}
                    >
                      {scheduleAtTime && (
                        <Card
                          className={`p-2 cursor-pointer transition-all hover:shadow-md ${
                            LESSON_TYPE_COLORS[scheduleAtTime.lessonType]
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onScheduleClick?.(scheduleAtTime);
                          }}
                        >
                          <div className="text-xs font-medium">
                            {LESSON_TYPE_LABELS[scheduleAtTime.lessonType]}
                          </div>
                          <div className="text-xs">
                            {scheduleAtTime.startTime} - {scheduleAtTime.endTime}
                          </div>
                          <div className="text-xs mt-1">
                            {scheduleAtTime.bookedStudents.length}/{scheduleAtTime.maxStudents}{' '}
                            students
                          </div>
                          {scheduleAtTime.status !== 'available' && (
                            <div className="text-xs mt-1 font-semibold">
                              {scheduleAtTime.status}
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
