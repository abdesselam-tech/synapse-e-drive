/**
 * Quiz List Component
 * Displays available quizzes for students
 */

'use client';

import type { Quiz, QuizLanguage } from '@/lib/types/quiz';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizListProps {
  quizzes: Quiz[];
  language?: QuizLanguage;
}

const categoryLabels: Record<string, string> = {
  'road-signs': 'Road Signs',
  'traffic-rules': 'Traffic Rules',
  'parking': 'Parking',
  'right-of-way': 'Right of Way',
  'speed-limits': 'Speed Limits',
  'emergency-procedures': 'Emergency Procedures',
  'vehicle-safety': 'Vehicle Safety',
  'general-knowledge': 'General Knowledge',
};

export default function QuizList({ quizzes, language = 'en' }: QuizListProps) {
  const router = useRouter();

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No quizzes available yet.</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new quizzes!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="hover:shadow-md transition">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl">{quiz.title[language]}</CardTitle>
                {quiz.description && quiz.description[language] && (
                  <p className="text-gray-600 mt-1">{quiz.description[language]}</p>
                )}
              </div>
              <Button
                onClick={() => router.push(`/student/quizzes/take/${quiz.id}`)}
                className="ml-4"
              >
                Start Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {categoryLabels[quiz.category] || quiz.category}
              </span>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                {quiz.questions.length} questions
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {quiz.passingScore}% to pass
              </span>
              {quiz.timeLimit && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  ⏱️ {quiz.timeLimit} min
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {quiz.totalAttempts} {quiz.totalAttempts === 1 ? 'attempt' : 'attempts'} total
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
