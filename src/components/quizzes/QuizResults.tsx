/**
 * Quiz Results Component
 * Shows quiz results with answer review
 */

'use client';

import type { Quiz, QuizQuestion, QuizAttempt, QuizLanguage } from '@/lib/types/quiz';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizResultsProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  questions: QuizQuestion[];
}

export default function QuizResults({ attempt, quiz, questions }: QuizResultsProps) {
  const router = useRouter();
  const language: QuizLanguage = attempt.language;

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  const correctCount = questions.filter((q, i) => attempt.answers[i] === q.correctAnswer).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <Card className="text-center">
        <CardContent className="py-8">
          <div className={`text-6xl mb-4 ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
            {attempt.passed ? '✓' : '✗'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {attempt.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {attempt.passed ? 'You passed the quiz!' : 'You did not pass this time.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{attempt.score}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{correctCount}/{questions.length}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-600">{quiz.passingScore}%</div>
              <div className="text-sm text-gray-600">Passing</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-600">{formatTime(attempt.timeSpent)}</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/student/quizzes')}
            >
              Back to Quizzes
            </Button>
            <Button
              onClick={() => router.push(`/student/quizzes/take/${quiz.id}`)}
            >
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = attempt.answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`text-2xl flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                          Q{index + 1}
                        </span>
                        <h3 className="font-semibold flex-1">{question.question[language]}</h3>
                      </div>

                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="max-w-sm rounded-lg mb-3"
                        />
                      )}

                      <div className="space-y-2 mb-3">
                        {question.options[language].map((option, optIndex) => {
                          const isUserAnswer = userAnswer === optIndex;
                          const isCorrectAnswer = question.correctAnswer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-md ${
                                isCorrectAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : isUserAnswer
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <span className="text-green-600">✓</span>}
                                {isUserAnswer && !isCorrectAnswer && <span className="text-red-600">✗</span>}
                                <span className={isCorrectAnswer || isUserAnswer ? 'font-medium' : ''}>
                                  {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && question.explanation[language] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="font-medium text-blue-900 mb-1">Explanation:</div>
                          <div className="text-blue-800 text-sm">{question.explanation[language]}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
