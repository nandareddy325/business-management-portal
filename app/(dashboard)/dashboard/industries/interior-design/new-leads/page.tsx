import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddLeadButton } from '@/components/interior/add-lead-button'
import { NewLeadsTable } from '@/components/interior/new-leads-table'

export const dynamic = 'force-dynamic'

export default async function NewLeadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'new')
    .order('created_at', { ascending: false })

  const today = new Date().toDateString()
  const todayCount = leads?.filter(l => new Date(l.created_at).toDateString() === today).length ?? 0
  const withBudget = leads?.filter((l: any) => l.budget).length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>
            Interior Design · Pipeline
          </p>
          <h1 className="text-2xl font-bold text-[#1C1712]">New Leads</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> total leads
          </p>
        </div>
        <AddLeadButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total New Leads', value: count ?? 0,  color: '#7C3AED' },
          { label: 'Added Today',     value: todayCount,  color: '#B8860B' },
          { label: 'With Budget',     value: withBudget,  color: '#059669' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table with panel */}
      <NewLeadsTable leads={leads ?? []} count={count ?? 0} />
    </div>
  )
}