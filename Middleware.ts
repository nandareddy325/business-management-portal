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

  // ── Public pages — no auth needed ──────────────────────────
  const publicPaths = ['/login', '/signup', '/onboarding', '/subscription/renew']
  if (!user) {
    if (publicPaths.some(p => path.startsWith(p))) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Role check ──────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const companyId = profile?.company_id

  // Employee → only /employee/*
  if (role === 'employee' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/employee', request.url))
  }

  // Super admin → /admin/*
  if (role === 'super_admin' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // ── Trial expiry check — dashboard pages only ───────────────
  const isDashboardPath = path.startsWith('/dashboard') || path.startsWith('/crm') ||
    path.startsWith('/billing') || path.startsWith('/hr') ||
    path.startsWith('/reports') || path.startsWith('/settings')

  if (isDashboardPath && companyId) {
    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('status, trial_ends_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscription) {
      const isTrial = subscription.status === 'trial'
      const trialEnded = subscription.trial_ends_at
        ? new Date(subscription.trial_ends_at) < new Date()
        : false

      // Trial expired → block & redirect to renew page
      if (isTrial && trialEnded) {
        return NextResponse.redirect(new URL('/subscription/renew', request.url))
      }
    }
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
    '/subscription/:path*',
  ],
}