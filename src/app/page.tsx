import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/server/actions/helpers';

export default async function HomePage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/app/page.tsx:7',message:'home page entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value || null;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const user = await requireAuth(token);
    if (!user.role) {
      redirect('/auth/login?error=missing-role');
    }

    redirect(`/${user.role}/dashboard`);
  } catch {
    redirect('/auth/login');
  }
}
