import { NextResponse } from 'next/server';
import { checkIfAdminsExist } from '@/lib/server/actions/auth';

/**
 * GET /api/auth/check-admin
 * Check if any admin exists in the system
 * Used by middleware to determine if first-admin setup is needed
 */
export async function GET() {
  try {
    const result = await checkIfAdminsExist();
    
    // Cache for 60 seconds to avoid hitting Firestore on every request
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    // If there's an error, assume admin exists to prevent unauthorized access
    return NextResponse.json({ hasAdmin: true });
  }
}
