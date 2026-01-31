/**
 * Teacher Notes Editor Component
 * Allows teachers to add/edit notes for a booking
 */

'use client';

import { useState } from 'react';
import { addTeacherNoteToBooking } from '@/lib/server/actions/bookings';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeacherNotesEditorProps {
  bookingId: string;
  initialNotes?: string | null;
  onSaved?: () => void;
}

export default function TeacherNotesEditor({
  bookingId,
  initialNotes,
  onSaved,
}: TeacherNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const result = await addTeacherNoteToBooking(bookingId, notes);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Notes saved!' });
      setEditing(false);
      if (onSaved) {
        setTimeout(onSaved, 1000);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save notes' });
    }

    setSaving(false);
  }

  function handleCancel() {
    setNotes(initialNotes || '');
    setEditing(false);
    setMessage(null);
  }

  // Not editing and no notes - show add button
  if (!editing && !initialNotes) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        + Add Teacher Notes
      </button>
    );
  }

  // Not editing but has notes - show notes with edit button
  if (!editing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-blue-900 text-sm">Teacher Notes:</div>
          <button
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            Edit
          </button>
        </div>
        <div className="text-blue-800 text-sm whitespace-pre-wrap">{initialNotes}</div>
      </div>
    );
  }

  // Editing mode
  return (
    <div className="space-y-2">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">Teacher Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about this lesson (visible to student)..."
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={saving}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
