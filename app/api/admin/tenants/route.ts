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

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, count, error } = await query

    if (error) throw error

    const companies = data || []

    // Fetch subscription info (activated_at) for these companies in one batch
    let subscriptionMap: Record<string, string | null> = {}
    if (companies.length > 0) {
      const companyIds = companies.map((c) => c.id)
      const { data: subs } = await supabase
        .from('company_subscriptions')
        .select('company_id, activated_at')
        .in('company_id', companyIds)

      if (subs) {
        subscriptionMap = subs.reduce((acc: Record<string, string | null>, s) => {
          acc[s.company_id] = s.activated_at
          return acc
        }, {})
      }
    }

    const enrichedData = companies.map((c) => ({
      ...c,
      subscription_activated_at: subscriptionMap[c.id] ?? null,
    }))

    return NextResponse.json({
      data: enrichedData,
      count: count || 0,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}