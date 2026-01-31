/**
 * Exam Request Form Component
 * For students to submit exam requests
 */

'use client';

import { useState } from 'react';
import { createExamRequest } from '@/lib/server/actions/examRequests';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamType } from '@/lib/types/examRequest';

interface ExamRequestFormProps {
  onSuccess?: () => void;
}

export default function ExamRequestForm({ onSuccess }: ExamRequestFormProps) {
  const [examType, setExamType] = useState<ExamType>('theory');
  const [requestedDate, setRequestedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createExamRequest({
      examType,
      requestedDate: requestedDate || undefined,
      notes: notes || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Request submitted!' });
      setExamType('theory');
      setRequestedDate('');
      setNotes('');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to submit request' });
    }

    setLoading(false);
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Driving Exam</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Exam Type</Label>
            <Select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="mt-1"
            >
              <option value="theory">Theory Exam</option>
              <option value="practical">Practical Driving Exam</option>
              <option value="road-test">Road Test</option>
            </Select>
          </div>

          <div>
            <Label>Preferred Date (Optional)</Label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              min={minDate}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">This is your preferred date. Actual exam date will be confirmed by admin.</p>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Any additional information or special requests..."
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
