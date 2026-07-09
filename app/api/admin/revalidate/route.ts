// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    // Revalidate all admin paths
    const adminPaths = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/audit-logs',
      '/admin/analytics',
      '/admin/api-keys',
      '/admin/system-monitor',
      '/admin/backup',
      '/admin/email-templates',
      '/admin/revenue',
      '/admin/subscriptions',
      '/admin/support-tickets',
      '/admin/tenants',
      '/admin/settings'
    ]

    for (const path of adminPaths) {
      revalidatePath(path, 'layout')
    }

    // Clear all public paths too
    revalidatePath('/', 'layout')

    return NextResponse.json({ 
      success: true, 
      message: 'All caches cleared successfully',
      pathsCleared: adminPaths.length
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    )
  }
}