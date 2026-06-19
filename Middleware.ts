import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) { response.cookies.set({ name, value, ...options }) },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Not logged in → login page
  if (!user) {
    if (path === '/login' || path === '/signup') return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Employee → only /employee/* allowed
  if (role === 'employee' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/employee', request.url))
  }

  // Super admin → /admin/*
  if (role === 'super_admin' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/crm/:path*',
    '/billing/:path*',
    '/hr/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/employee/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
}