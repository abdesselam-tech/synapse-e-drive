/**
 * Quiz Taking Page
 * Dynamic route for taking a specific quiz
 */

import { getQuizById } from '@/lib/server/actions/quizzes';
import QuizTaker from '@/components/quizzes/QuizTaker';
import { redirect } from 'next/navigation';

interface TakeQuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function TakeQuizPage({ params }: TakeQuizPageProps) {
  const { id } = await params;
  
  try {
    const { quiz, questions } = await getQuizById(id);
    
    if (questions.length === 0) {
      redirect('/student/quizzes');
    }
    
    return <QuizTaker quiz={quiz} questions={questions} />;
  } catch {
    redirect('/student/quizzes');
  }
}
