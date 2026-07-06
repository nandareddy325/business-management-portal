import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadDetailClient } from '@/components/interior/lead-detail-client'

export const dynamic = 'force-dynamic'

// Normalize timestamp — ensure UTC (add Z if no timezone info)
function normalizeTs(ts: string): string {
  if (!ts) return ts
  if (ts.includes('+') || ts.endsWith('Z')) return ts
  return ts + 'Z'
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id?: string; leadId?: string }> | { id?: string; leadId?: string }
}) {
  const resolvedParams = params instanceof Promise ? await params : params
  const leadId = resolvedParams.id || resolvedParams.leadId || ''

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads').select('*').eq('id', leadId).single()

  let activities: any[] = []
  try {
    const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Fetch activities via REST
    const actsRes = await fetch(
      `${SURL}/rest/v1/lead_activities?lead_id=eq.${leadId}&order=created_at.desc`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` }, cache: 'no-store' }
    )
    const acts = actsRes.ok ? await actsRes.json() : []

    // Fetch user profiles
    const userIds = [...new Set((acts ?? []).map((a: any) => a.user_id).filter(Boolean))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const profRes = await fetch(
        `${SURL}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,full_name,email`,
        { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` }, cache: 'no-store' }
      )
      if (profRes.ok) {
        const profiles = await profRes.json()
        profiles?.forEach((p: any) => {
          userMap[p.id] = p.full_name || p.email || 'Unknown'
        })
      }
    }

    activities = (acts ?? []).map((a: any) => ({
      ...a,
      created_at: normalizeTs(a.created_at),  // ✅ normalize
      user_name: a.user_id ? (userMap[a.user_id] || 'Unknown') : null
    }))
  } catch (e) {
    console.error('Activities fetch error:', e)
  }

  // Add synthetic created activity
  if (lead?.created_at) {
    activities = [...activities, {
      id: 'created', type: 'created',
      title: 'Lead Created',
      description: `Added via ${lead.source || 'manual entry'}`,
      created_at: normalizeTs(lead.created_at),  // ✅ normalize
    }].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="font-bold text-[#1C1712]">Lead not found</p>
          <a href="/dashboard/industries/interior-design/new-leads"
            className="mt-4 text-sm text-[#B8860B] underline block">Go Back</a>
        </div>
      </div>
    )
  }

  return <LeadDetailClient lead={lead} activities={activities} leadId={leadId} />
}