/**
 * Quiz Taker Component
 * Interactive quiz-taking interface with timer and navigation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { submitQuizAttempt } from '@/lib/server/actions/quizzes';
import type { Quiz, QuizQuestion, QuizLanguage } from '@/lib/types/quiz';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface QuizTakerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
}

export default function QuizTaker({ quiz, questions }: QuizTakerProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<QuizLanguage>('en');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    
    if (!autoSubmit && answers.some(a => a === -1)) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const result = await submitQuizAttempt({
      quizId: quiz.id,
      answers: answers.map(a => a === -1 ? 0 : a),
      timeSpent,
      language,
    });

    if (result.success && result.attemptId) {
      router.push(`/student/quizzes/results/${result.attemptId}`);
    } else {
      alert(result.error || 'Failed to submit quiz');
      setSubmitting(false);
    }
  }, [submitting, answers, startTime, quiz.id, language, router]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSubmit]);

  function selectAnswer(answerIndex: number) {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  }

  function goToQuestion(index: number) {
    setCurrentQuestion(index);
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const question = questions[currentQuestion];
  const answered = answers.filter(a => a !== -1).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-2xl">{quiz.title[language]}</CardTitle>
              {quiz.description && quiz.description[language] && (
                <p className="text-gray-600 mt-1">{quiz.description[language]}</p>
              )}
            </div>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value as QuizLanguage)}
              className="w-32"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </Select>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-4">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Answered: {answered}/{questions.length}</span>
            </div>
            {timeRemaining !== null && (
              <div className={`font-mono font-bold text-lg ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                ⏱️ {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(answered / questions.length) * 100}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="mb-6">
            <div className="flex items-start gap-2 mb-4">
              <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded">
                Q{currentQuestion + 1}
              </span>
              <h2 className="text-xl font-semibold flex-1">{question.question[language]}</h2>
            </div>
            
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question visual"
                className="max-w-md mx-auto rounded-lg mb-4"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options[language].map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                className={`w-full p-4 text-left border-2 rounded-lg transition ${
                  answers[currentQuestion] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestion] === index
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion] === index && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </Button>
            
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>

            <Button
              variant="outline"
              onClick={nextQuestion}
              disabled={currentQuestion === questions.length - 1}
            >
              Next →
            </Button>
          </div>

          {/* Question Navigator */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-10 h-10 rounded-md font-medium transition ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== -1
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle>Submit Quiz?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">
                You have answered {answered} out of {questions.length} questions.
              </p>
              {answers.some(a => a === -1) && (
                <p className="text-orange-600 mb-4">
                  ⚠️ Warning: You have {questions.length - answered} unanswered question(s).
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    handleSubmit(true);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
