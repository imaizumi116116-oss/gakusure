import { NextResponse, type NextRequest } from 'next/server';

const CLIENT_ID_COOKIE_NAME = 'clientId';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Avoid setting cookies on static assets for better caching.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg'
  ) {
    return NextResponse.next();
  }

  const existing = request.cookies.get(CLIENT_ID_COOKIE_NAME)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set({
    name: CLIENT_ID_COOKIE_NAME,
    value: crypto.randomUUID(),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
