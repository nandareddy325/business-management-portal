import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadDetailClient } from '@/components/interior/lead-detail-client'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? await params : params
  const { id } = resolvedParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads').select('*').eq('id', id).single()

  let activities: any[] = []
  try {
    // Use admin client to bypass RLS on lead_activities
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: acts } = await supabaseAdmin
      .from('lead_activities').select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })

    // Fetch user names for activities
    const userIds = [...new Set((acts ?? []).map((a: any) => a.user_id).filter(Boolean))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles').select('id, full_name, email')
        .in('id', userIds)
      profiles?.forEach((p: any) => {
        userMap[p.id] = p.full_name || p.email || 'Unknown'
      })
    }
    activities = (acts ?? []).map((a: any) => ({
      ...a,
      user_name: a.user_id ? (userMap[a.user_id] || 'Unknown') : null
    }))
  } catch {}

  // Add synthetic created activity
  if (lead?.created_at) {
    activities = [...activities, {
      id: 'created', type: 'created',
      title: 'Lead Created',
      description: `Added via ${lead.source || 'manual entry'}`,
      created_at: lead.created_at,
    }].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="font-bold text-[#1C1712]">Lead not found</p>
          <a href="/dashboard/industries/interior-design/new-leads" className="mt-4 text-sm text-[#B8860B] underline block">Go Back</a>
        </div>
      </div>
    )
  }

  return <LeadDetailClient lead={lead} activities={activities} leadId={id} />
}