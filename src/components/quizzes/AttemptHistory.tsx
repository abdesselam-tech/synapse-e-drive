/**
 * Attempt History Component
 * Shows student's past quiz attempts
 */

'use client';

import type { QuizAttempt } from '@/lib/types/quiz';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AttemptHistoryProps {
  attempts: QuizAttempt[];
}

export default function AttemptHistory({ attempts }: AttemptHistoryProps) {
  const router = useRouter();

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No quiz attempts yet.</p>
          <p className="text-sm text-gray-400 mt-2">Take your first quiz to see results here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <Card key={attempt.id} className="hover:shadow-md transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{attempt.quizTitle[attempt.language]}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    attempt.passed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attempt.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Score: {attempt.score}%
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {formatTime(attempt.timeSpent)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{formatDate(attempt.completedAt)}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/student/quizzes/results/${attempt.id}`)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
