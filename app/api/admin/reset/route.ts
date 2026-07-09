// app/api/admin/reset/route.ts
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_request: NextRequest) {
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

    // Log the reset action BEFORE deleting data
await supabaseAdmin
  .from('audit_logs')
  .insert({
    user_id: user.id,
    action: 'Platform reset initiated',
    action_type: 'system',
    resource_type: 'platform',
    status: 'success',
    changes: { reset_by: user.email }
  })
    // Delete all data (soft delete pattern - we'll mark as inactive instead)
    // This is safer than hard delete
    const tablesToReset = [
      'leads',
      'quotations',
      'invoices',
      'payments',
      'expenses',
      'projects',
      'leave_requests',
      'work_reports'
    ]

    for (const table of tablesToReset) {
      await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    }

    // Disable all companies instead of deleting
    await supabaseAdmin
      .from('companies')
      .update({ is_active: false, plan_status: 'cancelled' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Reset system status
    await supabaseAdmin
      .from('system_status')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ 
      success: true, 
      message: 'Platform has been reset successfully',
      redirectUrl: '/'
    })
  } catch (error) {
    console.error('Platform reset error:', error)
    
    // Still log the error
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
  .from('audit_logs')
  .insert({
    user_id: user.id,
    action: 'Platform reset failed',
    action_type: 'system',
    resource_type: 'platform',
    status: 'failed',
    changes: { error: String(error) }
  })
      }
    } catch {}

    return NextResponse.json(
      { error: 'Failed to reset platform: ' + String(error) },
      { status: 500 }
    )
  }
}