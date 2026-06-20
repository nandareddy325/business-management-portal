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
    const { data: acts } = await supabase
      .from('lead_activities').select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
    activities = acts ?? []
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