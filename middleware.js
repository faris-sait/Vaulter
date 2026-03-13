import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Make home page and sign-in/sign-up pages public
const isPublicRoute = createRouteMatcher([
  '/',
  '/cli(.*)',
  '/mcp-access(.*)',
  '/mcp-acess(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/dashboard/mcp-access(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/cli-auth(.*)',
  '/api(.*)',
  '/mcp(.*)',
  '/register(.*)',
  '/token(.*)',
  '/.well-known(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
