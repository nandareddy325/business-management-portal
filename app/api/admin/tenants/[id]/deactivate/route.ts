// app/api/admin/tenants/[id]/deactivate/route.ts - NEXT.JS 16 FIX
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id: tenantId } = await params

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Update company status
    const { data, error } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', tenantId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate tenant' },
        { status: 400 }
      )
    }

    // Log audit trail (fire and forget - non-critical)
    void supabase
      .from('audit_logs')
      .insert({
        action: 'tenant_deactivated',
        action_type: 'deactivate_tenant',
        resource_type: 'companies',
        resource_id: tenantId,
        changes: { is_active: false },
        status: 'success',
      })

    return NextResponse.json({
      success: true,
      message: 'Tenant deactivated successfully',
      data,
    })
  } catch (error) {
    console.error('Error deactivating tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}