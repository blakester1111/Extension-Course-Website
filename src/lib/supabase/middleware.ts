import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Helper: create a redirect that preserves session cookies (including all options)
  function redirectWithCookies(url: URL | string) {
    const redirectUrl = typeof url === 'string' ? new URL(url, request.url) : url
    const response = NextResponse.redirect(redirectUrl)
    // Copy all cookies from supabaseResponse with full options (path, httpOnly, secure, sameSite, etc.)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie)
    })
    return response
  }

  // Public routes that don't require auth
  const publicRoutes = ['/', '/catalog', '/calculator', '/how-it-works', '/invite', '/contact', '/copyright', '/privacy', '/terms', '/legal', '/login', '/signup', '/forgot-password', '/callback']
  const isPublicRoute = publicRoutes.some(route => pathname === route) ||
    pathname.startsWith('/catalog/') ||
    pathname.startsWith('/enroll/') ||
    pathname.startsWith('/api/')

  // If not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return redirectWithCookies(url)
  }

  // If authenticated, check role-based access
  if (user && (pathname.startsWith('/student') || pathname.startsWith('/supervisor') || pathname.startsWith('/admin'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const role = profile.role
      const isAdminLike = role === 'admin' || role === 'super_admin'
      const dashboardRole = role === 'super_admin' ? 'admin' : role
      // All authenticated users can access /student/* (student pages are scoped to user.id)
      // This allows supervisors, admins, and super_admins who are enrolled in courses to access their student view
      if (pathname.startsWith('/supervisor') && role !== 'supervisor' && !isAdminLike) {
        return redirectWithCookies(new URL(`/${dashboardRole}/dashboard`, request.url))
      }
      if (pathname.startsWith('/admin') && !isAdminLike) {
        return redirectWithCookies(new URL(`/${dashboardRole}/dashboard`, request.url))
      }
    }
  }

  // Redirect authenticated users from auth pages to their dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const dashboardRole = profile.role === 'super_admin' ? 'admin' : profile.role
      return redirectWithCookies(new URL(`/${dashboardRole}/dashboard`, request.url))
    }
  }

  return supabaseResponse
}
