import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for role-based routing
 * Enforces access control based on user roles
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:10',message:'middleware entry',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  // Allow public routes
  const publicRoutes = ['/auth', '/api/auth'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:15',message:'public route allow',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return NextResponse.next();
  }

  // Get auth token from cookies or headers
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });

  if (!verifyResponse.ok) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const verifyData = (await verifyResponse.json()) as { role?: string | null };
  const role = verifyData.role;

  // For protected routes, verify token and role
  if (pathname.startsWith('/admin')) {
    // Admin routes require admin role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/teacher')) {
    // Teacher routes require teacher or admin role
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/student')) {
    // Student routes require student, teacher, or admin role
    if (role !== 'student' && role !== 'teacher' && role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  // Default: allow access (actual role checking happens in ProtectedRoute component)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
