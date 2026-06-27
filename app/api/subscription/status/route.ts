import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id required' }, { status: 400 })
    }

    const { data: sub, error } = await supabase
      .from('company_subscriptions')
      .select('status, trial_ends_at, activated_at, total_amount, plan_config')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const now = new Date()
    const trialEndsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
    const isTrial = sub.status === 'trial'
    const isExpired = isTrial && trialEndsAt ? trialEndsAt < now : false
    const daysRemaining = trialEndsAt && !isExpired
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      status: sub.status,
      is_trial: isTrial,
      is_expired: isExpired,
      days_remaining: daysRemaining,
      trial_ends_at: sub.trial_ends_at,
      activated_at: sub.activated_at,
      total_amount: sub.total_amount,
      plan_config: sub.plan_config,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}