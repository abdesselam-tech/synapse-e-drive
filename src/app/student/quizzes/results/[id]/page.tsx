/**
 * Quiz Results Page
 * Shows results and review for a specific attempt
 */

import { getAttemptDetails } from '@/lib/server/actions/quizzes';
import QuizResults from '@/components/quizzes/QuizResults';
import { redirect } from 'next/navigation';

interface QuizResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizResultsPage({ params }: QuizResultsPageProps) {
  const { id } = await params;
  
  try {
    const { attempt, quiz, questions } = await getAttemptDetails(id);
    
    return <QuizResults attempt={attempt} quiz={quiz} questions={questions} />;
  } catch {
    redirect('/student/quizzes');
  }
}
