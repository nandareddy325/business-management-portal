import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // ── Security: only Vercel cron can call this ──
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Get companies with auto_delete_lost_days set ──
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('id, name, auto_delete_lost_days')
    .not('auto_delete_lost_days', 'is', null)
    .gt('auto_delete_lost_days', 0)

  if (compErr) {
    console.error('[Cron] companies fetch error:', compErr)
    return NextResponse.json({ error: compErr.message }, { status: 500 })
  }

  if (!companies || companies.length === 0) {
    return NextResponse.json({ message: 'No companies with auto-delete enabled', deleted: 0 })
  }

  const results = []

  for (const company of companies) {
    const days = company.auto_delete_lost_days as number

    // Calculate cutoff date
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffISO = cutoff.toISOString()

    // Delete lost leads older than cutoff for this company only
    const { data: deleted, error: delErr } = await supabase
      .from('leads')
      .delete()
      .eq('company_id', company.id)
      .eq('pipeline_stage', 'lost')
      .lt('updated_at', cutoffISO)
      .select('id')

    const result = {
      company_id: company.id,
      company_name: company.name,
      auto_delete_days: days,
      cutoff_date: cutoffISO,
      deleted_count: deleted?.length ?? 0,
      error: delErr?.message ?? null,
    }

    results.push(result)
    console.log(`[Cron] ${company.name}: deleted ${deleted?.length ?? 0} lost leads (older than ${days} days)`)
  }

  const totalDeleted = results.reduce((sum, r) => sum + r.deleted_count, 0)

  return NextResponse.json({
    success: true,
    ran_at: new Date().toISOString(),
    companies_processed: companies.length,
    total_deleted: totalDeleted,
    results,
  })
}