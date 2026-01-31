/**
 * Quiz Form Component
 * For creating quizzes from question bank
 */

'use client';

import { useState, useEffect } from 'react';
import { createQuiz, getQuestions } from '@/lib/server/actions/quizzes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuizCategory, QuizQuestion } from '@/lib/types/quiz';

const categories: { value: QuizCategory; label: string }[] = [
  { value: 'road-signs', label: 'Road Signs' },
  { value: 'traffic-rules', label: 'Traffic Rules' },
  { value: 'parking', label: 'Parking' },
  { value: 'right-of-way', label: 'Right of Way' },
  { value: 'speed-limits', label: 'Speed Limits' },
  { value: 'emergency-procedures', label: 'Emergency Procedures' },
  { value: 'vehicle-safety', label: 'Vehicle Safety' },
  { value: 'general-knowledge', label: 'General Knowledge' },
];

interface QuizFormProps {
  onQuizCreated?: () => void;
}

export default function QuizForm({ onQuizCreated }: QuizFormProps) {
  const [titleEn, setTitleEn] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  
  const [descEn, setDescEn] = useState('');
  const [descFr, setDescFr] = useState('');
  const [descAr, setDescAr] = useState('');
  
  const [category, setCategory] = useState<QuizCategory>('general-knowledge');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);
  
  const [availableQuestions, setAvailableQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [filterCategory]);

  async function loadQuestions() {
    setLoadingQuestions(true);
    try {
      const questions = await getQuestions({
        category: filterCategory || undefined,
      });
      setAvailableQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  }

  function toggleQuestion(questionId: string) {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (selectedQuestions.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one question' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createQuiz({
      title: { en: titleEn, fr: titleFr, ar: titleAr },
      description: descEn || descFr || descAr ? { en: descEn, fr: descFr, ar: descAr } : undefined,
      category,
      questionIds: selectedQuestions,
      passingScore,
      timeLimit: timeLimit && parseInt(timeLimit) > 0 ? parseInt(timeLimit) : undefined,
      isPublished,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Quiz created!' });
      // Reset form
      setTitleEn('');
      setTitleFr('');
      setTitleAr('');
      setDescEn('');
      setDescFr('');
      setDescAr('');
      setSelectedQuestions([]);
      setPassingScore(70);
      setTimeLimit('');
      setIsPublished(false);
      
      if (onQuizCreated) {
        setTimeout(onQuizCreated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create quiz' });
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Title */}
          <div className="space-y-4">
            <h3 className="font-medium">Quiz Title</h3>
            <div>
              <Label>English</Label>
              <Input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
                placeholder="Enter quiz title in English..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>French</Label>
              <Input
                type="text"
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                required
                placeholder="Entrez le titre en français..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Arabic</Label>
              <Input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                required
                dir="rtl"
                placeholder="أدخل العنوان بالعربية..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Quiz Description (Optional) */}
          <div className="space-y-4">
            <h3 className="font-medium">Description (Optional)</h3>
            <div>
              <Label>English</Label>
              <Textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={2}
                placeholder="Optional description..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>French</Label>
              <Textarea
                value={descFr}
                onChange={(e) => setDescFr(e.target.value)}
                rows={2}
                placeholder="Description optionnelle..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Arabic</Label>
              <Textarea
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                rows={2}
                dir="rtl"
                placeholder="وصف اختياري..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as QuizCategory)}
                className="mt-1"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Passing Score (%)</Label>
              <Input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min={0}
                max={100}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time Limit (minutes, optional)</Label>
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                min={1}
                placeholder="No limit"
                className="mt-1"
              />
            </div>
            <div className="flex items-center pt-7">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish immediately (visible to students)
              </Label>
            </div>
          </div>

          {/* Question Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Select Questions ({selectedQuestions.length} selected)</h3>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-48"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Select>
            </div>

            {loadingQuestions ? (
              <p className="text-gray-500 text-center py-4">Loading questions...</p>
            ) : availableQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No questions available. Create questions first.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-4">
                {availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-3 border rounded-md cursor-pointer transition ${
                      selectedQuestions.includes(question.id)
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestion(question.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{question.question.en}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{question.category}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{question.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || selectedQuestions.length === 0}
            className="w-full"
          >
            {loading ? 'Creating Quiz...' : 'Create Quiz'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
