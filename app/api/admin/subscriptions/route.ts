import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const limit = 15
    const from = (page - 1) * limit

    // Base query: companies joined manually with company_subscriptions
    let companyQuery = supabase
      .from('companies')
      .select('id, name, business_phone, industry, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      companyQuery = companyQuery.ilike('name', `%${search}%`)
    }

    const { data: allCompanies, error: companyError } = await companyQuery

    if (companyError) throw companyError

    const companies = allCompanies || []
    const companyIds = companies.map((c) => c.id)

    // Fetch subscription rows for these companies
    type SubscriptionRow = {
      company_id: string
      plan_config: Record<string, string> | null
      status: string | null
      total_amount: number | null
      billing_cycle: string | null
      max_users: number | null
      trial_ends_at: string | null
      activated_at: string | null
      razorpay_subscription_id: string | null
      razorpay_plan_id: string | null
    }

    let subs: Record<string, SubscriptionRow> = {}
    if (companyIds.length > 0) {
      const { data: subRows, error: subError } = await supabase
        .from('company_subscriptions')
        .select('*')
        .in('company_id', companyIds)

      if (subError) throw subError

      subs = ((subRows || []) as SubscriptionRow[]).reduce((acc: Record<string, SubscriptionRow>, s) => {
        acc[s.company_id] = s
        return acc
      }, {})
    }

    // Merge + compute renewal date (calendar-month arithmetic, per billing_cycle)
    const merged = companies.map((c) => {
      const sub = subs[c.id] || null
      let planName: string | null = null
      if (sub?.plan_config && typeof sub.plan_config === 'object') {
        const values = Object.values(sub.plan_config)
        planName = values.length > 0 ? values[0] : null
      }

      let nextRenewal: string | null = null
      if (sub?.activated_at) {
        const d = new Date(sub.activated_at)
        if (sub.billing_cycle === 'yearly') {
          d.setFullYear(d.getFullYear() + 1)
        } else {
          d.setMonth(d.getMonth() + 1)
        }
        nextRenewal = d.toISOString()
      }

      return {
        company_id: c.id,
        company_name: c.name,
        company_phone: c.business_phone,
        industry: c.industry,
        is_active: c.is_active,
        joined: c.created_at,
        plan_name: planName,
        status: sub?.status ?? 'none',
        total_amount: sub?.total_amount ?? 0,
        billing_cycle: sub?.billing_cycle ?? null,
        max_users: sub?.max_users ?? null,
        trial_ends_at: sub?.trial_ends_at ?? null,
        activated_at: sub?.activated_at ?? null,
        next_renewal: nextRenewal,
        razorpay_subscription_id: sub?.razorpay_subscription_id ?? null,
        razorpay_plan_id: sub?.razorpay_plan_id ?? null,
      }
    })

    // Summary stats across ALL matching companies (not just current page)
    const activeCount = merged.filter((m) => m.status === 'active').length
    const trialCount = merged.filter((m) => m.status === 'trial').length
    const cancelledCount = merged.filter((m) => m.status === 'cancelled' || m.status === 'halted').length
    const mrr = merged
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => sum + (m.total_amount || 0), 0)

    // Paginate the merged result
    const total = merged.length
    const pageData = merged.slice(from, from + limit)

    return NextResponse.json({
      data: pageData,
      count: total,
      summary: {
        activeCount,
        trialCount,
        cancelledCount,
        mrr,
      },
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}
