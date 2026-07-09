// ─────────────────────────────────────────────
// FILE 1: app/api/industries/add/route.ts
// ─────────────────────────────────────────────
// Save this as: app/api/industries/add/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { companyId, industrySlug, plan } = await req.json()

    if (!companyId || !industrySlug || !plan) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get industry id from slug
    const { data: ind, error: ie } = await supabase
      .from('industries')
      .select('id')
      .eq('slug', industrySlug)
      .single()

    if (ie || !ind) return NextResponse.json({ error: 'Industry not found' }, { status: 404 })

    // Check if already added
    const { data: existing } = await supabase
      .from('company_industries')
      .select('id')
      .eq('company_id', companyId)
      .eq('industry_id', ind.id)
      .single()

    if (existing) return NextResponse.json({ error: 'Industry already active' }, { status: 409 })

    // Insert new industry
    const { error: insertErr } = await supabase
      .from('company_industries')
      .insert({ company_id: companyId, industry_id: ind.id, is_active: true, plan })

    if (insertErr) throw insertErr

    // Update company subscription
    await supabase
      .from('company_subscriptions')
      .update({ updated_at: new Date().toISOString() })
      .eq('company_id', companyId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}