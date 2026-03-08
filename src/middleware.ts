import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Check auth by calling the session endpoint
  const sessionResponse = await fetch(
    new URL('/api/auth/get-session', request.url),
    {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    }
  );

  const session = sessionResponse.ok ? await sessionResponse.json() : null;

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublic && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/bookmarks', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
