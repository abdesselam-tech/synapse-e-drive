import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  const url = new URL('/auth/login', request.url);
  return NextResponse.redirect(url);
}
