/**
 * Student Quizzes Page
 * View available quizzes and attempt history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getQuizzes, getStudentAttempts } from '@/lib/server/actions/quizzes';
import QuizList from '@/components/quizzes/QuizList';
import AttemptHistory from '@/components/quizzes/AttemptHistory';
import { Select } from '@/components/ui/select';
import type { Quiz, QuizAttempt, QuizLanguage } from '@/lib/types/quiz';

export default function StudentQuizzesPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<QuizLanguage>('en');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      const { uid } = await response.json();

      const [quizzesData, attemptsData] = await Promise.all([
        getQuizzes(),
        getStudentAttempts(uid),
      ]);
      
      setQuizzes(quizzesData);
      setAttempts(attemptsData);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
          <p className="text-gray-600">Test your driving knowledge</p>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Available Quizzes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My History ({attempts.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'available' && <QuizList quizzes={quizzes} language={language} />}
          {activeTab === 'history' && <AttemptHistory attempts={attempts} />}
        </>
      )}
    </div>
  );
}
