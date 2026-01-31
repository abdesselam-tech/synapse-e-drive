import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/utils/constants/collections';

export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json({ ok: true, role: userData?.role ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
  }
}
