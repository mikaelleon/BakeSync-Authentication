import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidBakeshopSlug, DEMO_BAKESHOP_SLUG } from './lib/bakeshop-names'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files, API routes, and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/invitation') ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/test') ||
    pathname.startsWith('/simple-test') ||
    pathname.startsWith('/supabase-test') ||
    pathname.startsWith('/no-context') ||
    pathname.startsWith('/test-validation') ||
    pathname.startsWith('/debug-verification') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if this is a static route that should be redirected
  const staticRoutes = [
    '/dashboard',
    '/recipes',
    '/inventory',
    '/supply-chain',
    '/pos',
    '/production',
    '/financials',
    '/team'
  ]

  if (staticRoutes.includes(pathname)) {
    // For now, redirect to demo route as fallback
    // In production, this would need to determine the user's bakeshop slug
    const redirectUrl = new URL(`/demo${pathname}`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Validate bakeshop slugs in production routes
  const bakeshopRouteMatch = pathname.match(/^\/([a-z0-9-]+)\//)
  if (bakeshopRouteMatch) {
    const slug = bakeshopRouteMatch[1]
    
    // Allow demo routes
    if (slug === DEMO_BAKESHOP_SLUG) {
      return NextResponse.next()
    }
    
    // Validate production bakeshop slugs format
    if (!isValidBakeshopSlug(slug)) {
      // Redirect invalid bakeshop slugs to demo
      const redirectUrl = new URL(`/${DEMO_BAKESHOP_SLUG}${pathname.replace(`/${slug}`, '')}`, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Allow slug-based routes to pass through
  if (pathname.startsWith('/demo/') || pathname.match(/^\/[a-z0-9-]+\//)) {
    return NextResponse.next()
  }

  return NextResponse.next()
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
}
