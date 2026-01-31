/**
 * Teacher Quiz Management Page
 * Create and manage quizzes and questions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getQuizzes, getQuestions } from '@/lib/server/actions/quizzes';
import QuestionForm from '@/components/quizzes/QuestionForm';
import QuizForm from '@/components/quizzes/QuizForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Quiz, QuizQuestion } from '@/lib/types/quiz';

export default function TeacherQuizzesPage() {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'questions' | 'create-quiz' | 'create-question'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quizzesData, questionsData] = await Promise.all([
        getQuizzes(),
        getQuestions(),
      ]);
      setQuizzes(quizzesData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Management</h1>
        <p className="text-gray-600">Create and manage quizzes and questions for your students</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'quizzes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'questions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Question Bank ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('create-quiz')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'create-quiz'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Create Quiz
        </button>
        <button
          onClick={() => setActiveTab('create-question')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'create-question'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Create Question
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No quizzes created yet.</p>
                    <Button
                      onClick={() => setActiveTab('create-quiz')}
                      className="mt-4"
                    >
                      Create Your First Quiz
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{quiz.title.en}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {quiz.questions.length} questions • {quiz.passingScore}% to pass • {quiz.totalAttempts} attempts
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              quiz.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {quiz.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {quiz.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No questions created yet.</p>
                    <Button
                      onClick={() => setActiveTab('create-question')}
                      className="mt-4"
                    >
                      Create Your First Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                questions.map((question) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <p className="font-medium">{question.question.en}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {question.category}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {question.difficulty}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'create-quiz' && (
            <QuizForm onQuizCreated={() => {
              loadData();
              setActiveTab('quizzes');
            }} />
          )}

          {activeTab === 'create-question' && (
            <QuestionForm onQuestionCreated={() => {
              loadData();
              setActiveTab('questions');
            }} />
          )}
        </>
      )}
    </div>
  );
}
