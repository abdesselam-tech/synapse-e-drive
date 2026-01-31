/**
 * Schedule Form Component
 * Reusable form for creating and editing schedules
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleCreateSchema } from '@/lib/server/validators/schemas';
import { createSchedule, updateSchedule, type PlainSchedule } from '@/lib/server/actions/schedules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ScheduleFormData } from '@/lib/types/schedule';

interface ScheduleFormProps {
  mode: 'create' | 'edit';
  initialData?: PlainSchedule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ScheduleForm({ mode, initialData, onSuccess, onCancel }: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Helper to convert ISO string to Date
  const timestampToDate = (timestamp: string): Date => {
    return new Date(timestamp);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleCreateSchema),
    defaultValues: initialData
      ? {
          date: timestampToDate(initialData.date),
          startTime: initialData.startTime,
          endTime: initialData.endTime,
          lessonType: initialData.lessonType,
          maxStudents: initialData.maxStudents,
          location: initialData.location || '',
          notes: initialData.notes || '',
        }
      : {
          date: new Date(),
          startTime: '09:00',
          endTime: '10:30',
          lessonType: 'theoretical',
          maxStudents: 10,
          location: '',
          notes: '',
        },
  });

  const lessonType = watch('lessonType');

  // Auto-set maxStudents when lessonType changes
  useEffect(() => {
    if (lessonType === 'practical') {
      setValue('maxStudents', 1);
    } else if (lessonType === 'theoretical') {
      setValue('maxStudents', 10);
    } else {
      // exam_prep can vary, but default to 5
      if (!initialData) {
        setValue('maxStudents', 5);
      }
    }
  }, [lessonType, setValue, initialData]);

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'create') {
        await createSchedule(data);
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } else if (initialData) {
        await updateSchedule(initialData.id, data);
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving the schedule';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>
            Schedule {mode === 'create' ? 'created' : 'updated'} successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          min={formatDateForInput(new Date())}
          defaultValue={formatDateForInput(watch('date') || new Date())}
          onChange={(e) => {
            const dateValue = e.target.value ? new Date(e.target.value) : new Date();
            setValue('date', dateValue, { shouldValidate: true });
          }}
        />
        {errors.date && (
          <p className="text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            {...register('startTime')}
          />
          {errors.startTime && (
            <p className="text-sm text-red-600">{errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            {...register('endTime')}
          />
          {errors.endTime && (
            <p className="text-sm text-red-600">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {/* Lesson Type */}
      <div className="space-y-2">
        <Label htmlFor="lessonType">Lesson Type *</Label>
        <Select id="lessonType" {...register('lessonType')}>
          <option value="theoretical">Theoretical</option>
          <option value="practical">Practical</option>
          <option value="exam_prep">Exam Preparation</option>
        </Select>
        {errors.lessonType && (
          <p className="text-sm text-red-600">{errors.lessonType.message}</p>
        )}
      </div>

      {/* Max Students */}
      <div className="space-y-2">
        <Label htmlFor="maxStudents">Max Students *</Label>
        <Input
          id="maxStudents"
          type="number"
          min={1}
          max={10}
          disabled={lessonType === 'practical'}
          {...register('maxStudents', {
            valueAsNumber: true,
          })}
        />
        {lessonType === 'practical' && (
          <p className="text-sm text-muted-foreground">
            Practical lessons are limited to 1 student
          </p>
        )}
        {errors.maxStudents && (
          <p className="text-sm text-red-600">{errors.maxStudents.message}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          type="text"
          placeholder="e.g., Driving School Main Office"
          {...register('location')}
        />
        {errors.location && (
          <p className="text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional information about this lesson..."
          rows={3}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
        </Button>
      </div>
    </form>
  );
}
