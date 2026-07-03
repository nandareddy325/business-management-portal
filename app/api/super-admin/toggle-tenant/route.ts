// app/api/super-admin/toggle-tenant/route.ts - NEXT.JS 16 FIX
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, isActive } = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Update tenant status
    const { data, error } = await supabase
      .from('companies')
      .update({ is_active: !isActive })
      .eq('id', tenantId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update tenant status' },
        { status: 400 }
      )
    }

    // Log audit trail (fire and forget - non-critical)
    void supabase
      .from('audit_logs')
      .insert({
        action: isActive ? 'tenant_deactivated' : 'tenant_activated',
        action_type: 'toggle_tenant_status',
        resource_type: 'companies',
        resource_id: tenantId,
        changes: { is_active: !isActive },
        status: 'success',
      })

    return NextResponse.json({
      success: true,
      message: isActive ? 'Tenant deactivated successfully' : 'Tenant activated successfully',
      data,
    })
  } catch (error) {
    console.error('Error toggling tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}