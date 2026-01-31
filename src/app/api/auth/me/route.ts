/**
 * Current User API Route
 * Returns the current authenticated user's UID
 */

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return NextResponse.json({ uid: decodedToken.uid });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
