/**
 * Question Form Component
 * For creating multilingual quiz questions
 */

'use client';

import { useState } from 'react';
import { createQuestion } from '@/lib/server/actions/quizzes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuizCategory } from '@/lib/types/quiz';

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

interface QuestionFormProps {
  onQuestionCreated?: () => void;
}

export default function QuestionForm({ onQuestionCreated }: QuestionFormProps) {
  const [questionEn, setQuestionEn] = useState('');
  const [questionFr, setQuestionFr] = useState('');
  const [questionAr, setQuestionAr] = useState('');
  
  const [optionsEn, setOptionsEn] = useState(['', '', '', '']);
  const [optionsFr, setOptionsFr] = useState(['', '', '', '']);
  const [optionsAr, setOptionsAr] = useState(['', '', '', '']);
  
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [category, setCategory] = useState<QuizCategory>('general-knowledge');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createQuestion({
      question: { en: questionEn, fr: questionFr, ar: questionAr },
      options: { en: optionsEn, fr: optionsFr, ar: optionsAr },
      correctAnswer,
      category,
      difficulty,
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Question created!' });
      // Reset form
      setQuestionEn('');
      setQuestionFr('');
      setQuestionAr('');
      setOptionsEn(['', '', '', '']);
      setOptionsFr(['', '', '', '']);
      setOptionsAr(['', '', '', '']);
      setCorrectAnswer(0);
      
      if (onQuestionCreated) {
        setTimeout(onQuestionCreated, 1500);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create question' });
    }

    setLoading(false);
  }

  function updateOption(lang: 'en' | 'fr' | 'ar', index: number, value: string) {
    if (lang === 'en') {
      const newOptions = [...optionsEn];
      newOptions[index] = value;
      setOptionsEn(newOptions);
    } else if (lang === 'fr') {
      const newOptions = [...optionsFr];
      newOptions[index] = value;
      setOptionsFr(newOptions);
    } else {
      const newOptions = [...optionsAr];
      newOptions[index] = value;
      setOptionsAr(newOptions);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Question Text */}
          <div className="space-y-4">
            <h3 className="font-medium">Question Text (All languages required)</h3>
            <div>
              <Label>English</Label>
              <Textarea
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                required
                rows={2}
                placeholder="Enter question in English..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>French</Label>
              <Textarea
                value={questionFr}
                onChange={(e) => setQuestionFr(e.target.value)}
                required
                rows={2}
                placeholder="Entrez la question en français..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Arabic</Label>
              <Textarea
                value={questionAr}
                onChange={(e) => setQuestionAr(e.target.value)}
                required
                rows={2}
                dir="rtl"
                placeholder="أدخل السؤال بالعربية..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Answer Options (4 options required)</h3>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    className="w-4 h-4"
                  />
                  <Label className="font-medium">
                    Option {index + 1} {correctAnswer === index && '(Correct Answer)'}
                  </Label>
                </div>
                <Input
                  type="text"
                  value={optionsEn[index]}
                  onChange={(e) => updateOption('en', index, e.target.value)}
                  required
                  placeholder="English option..."
                />
                <Input
                  type="text"
                  value={optionsFr[index]}
                  onChange={(e) => updateOption('fr', index, e.target.value)}
                  required
                  placeholder="Option en français..."
                />
                <Input
                  type="text"
                  value={optionsAr[index]}
                  onChange={(e) => updateOption('ar', index, e.target.value)}
                  required
                  placeholder="الخيار بالعربية..."
                  dir="rtl"
                />
              </div>
            ))}
          </div>

          {/* Category & Difficulty */}
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
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="mt-1"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Question'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
