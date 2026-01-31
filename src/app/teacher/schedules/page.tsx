/**
 * Teacher Schedule Management Page
 * Server component that fetches schedules and renders the schedule manager
 * Includes unified view for both individual and group schedules
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAuthWithAnyRole } from '@/lib/server/actions/helpers';
import { 
  getSchedulesByTeacher, 
  getTeacherCombinedSchedule,
  type PlainSchedule,
  type CombinedScheduleItem 
} from '@/lib/server/actions/schedules';
import TeacherSchedulesClient from '@/components/teacher/TeacherSchedulesClient';
import { TeacherNav } from '@/components/teacher/TeacherNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

export default async function TeacherSchedulesPage() {
  const token = await getAuthToken();
  
  // Check authentication and role
  let user;
  try {
    user = await requireAuthWithAnyRole(token, ['teacher', 'admin']);
  } catch {
    redirect('/auth/login');
  }

  // Fetch both individual schedules and combined schedules
  let individualSchedules: PlainSchedule[] = [];
  let combinedSchedules: CombinedScheduleItem[] = [];
  
  try {
    [individualSchedules, combinedSchedules] = await Promise.all([
      getSchedulesByTeacher(user.id),
      getTeacherCombinedSchedule(user.id),
    ]);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    // Continue with empty arrays if there's an error
  }

  return (
    <ProtectedRoute requiredRoles={['teacher', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <TeacherNav />
        <div className="container mx-auto py-8 px-4">
          <TeacherSchedulesClient 
            initialIndividualSchedules={individualSchedules} 
            initialCombinedSchedules={combinedSchedules}
            teacherId={user.id} 
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
