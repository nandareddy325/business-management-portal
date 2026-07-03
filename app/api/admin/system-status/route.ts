// app/api/admin/system-status/route.ts
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get system status without auth check for monitoring tools
    const { data, error } = await supabaseAdmin
      .from('system_status')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch (error) {
    console.error('System status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    )
  }
}

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

    const { service_name, status, response_time_ms, is_healthy } = await request.json()

    if (!service_name || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: service_name, status' },
        { status: 400 }
      )
    }

    // Update or create system status
    const { data, error } = await supabaseAdmin
      .from('system_status')
      .upsert({
        service_name,
        status,
        response_time_ms: response_time_ms || 0,
        is_healthy: is_healthy !== false,
        checked_at: new Date().toISOString()
      }, {
        onConflict: 'service_name'
      })
      .select()
      .single()

    if (error) throw error

    // Log the update
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: `Updated system status for ${service_name}`,
        action_type: 'system',
        resource_type: 'system_status',
        status: 'success',
        changes: { service_name, status, response_time_ms, is_healthy }
      })

    return NextResponse.json({ 
      success: true, 
      data,
      message: `System status for ${service_name} updated` 
    })
  } catch (error) {
    console.error('System status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update system status' },
      { status: 500 }
    )
  }
}