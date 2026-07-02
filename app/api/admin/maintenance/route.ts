// app/api/admin/maintenance/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { enabled } = await request.json()

    // Update system status - set maintenance mode
    const { error } = await supabase
      .from('system_status')
      .upsert({
        service_name: 'platform',
        status: enabled ? 'maintenance' : 'operational',
        response_time_ms: 0,
        is_healthy: !enabled,
        message: enabled ? 'Platform in maintenance mode' : 'Platform operational',
        checked_at: new Date().toISOString()
      }, {
        onConflict: 'service_name'
      })

    if (error) throw error

    // Log the action
    await supabase
  .from('audit_logs')
  .insert({
    user_id: user.id,
    action: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
    action_type: 'system',
    resource_type: 'platform',
    status: 'success',
    changes: { maintenance_enabled: enabled }
  })

    return NextResponse.json({ 
      success: true, 
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}` 
    })
  } catch (error) {
    console.error('Maintenance mode error:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance mode' },
      { status: 500 }
    )
  }
}