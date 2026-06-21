import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Optimistic auth gate: redirect to /login when no session cookie is present on
// a protected route. Real role checks happen in server layouts/actions. We only
// read the cookie here (no DB) to keep the edge middleware fast.
const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on /login.
  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/workbook', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect pages only. All /api routes enforce their own auth and return JSON,
  // so they must not be redirected to the HTML login page (e.g. /api/health for
  // the docker healthcheck, /api/export downloads).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)'],
};
