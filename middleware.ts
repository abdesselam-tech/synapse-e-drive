import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for role-based routing
 * Enforces access control based on user roles
 * Handles first-admin setup flow for fresh deployments
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (including first-admin page)
  const publicRoutes = ['/auth', '/api/auth'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get auth token from cookies or headers
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // If no token, check if we need first-admin setup
  if (!token) {
    try {
      // Check if any admin exists
      const checkAdminResponse = await fetch(new URL('/api/auth/check-admin', request.url), {
        method: 'GET',
        cache: 'no-store',
      });

      if (checkAdminResponse.ok) {
        const { hasAdmin } = await checkAdminResponse.json() as { hasAdmin: boolean };
        
        if (!hasAdmin) {
          // No admin exists - redirect to first-admin setup
          return NextResponse.redirect(new URL('/auth/first-admin', request.url));
        }
      }
    } catch (error) {
      // If check fails, continue to normal login flow
      console.error('Error checking admin status in middleware:', error);
    }

    // Admin exists or check failed - redirect to login
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
