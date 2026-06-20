import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

export const dynamic = 'force-dynamic'

export default async function FreshLeadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads').select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'fresh-leads')
    .order('created_at', { ascending: false })

  const highInterest = leads?.filter((l: any) => l.interest === 'High').length ?? 0
  const totalBudget  = leads?.reduce((s, l: any) => s + Number(l.budget || 0), 0) ?? 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Fresh Leads</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
          <Zap className="w-4 h-4" />Fresh Stage
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Fresh',   value: String(count ?? 0), color: '#7C3AED' },
          { label: 'High Interest', value: String(highInterest), color: '#059669' },
          { label: 'Total Budget',  value: totalBudget ? '₹' + (totalBudget / 100000).toFixed(1) + 'L' : '—', color: '#B8860B' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <LeadTable leads={leads ?? []} count={count ?? 0} footerText="fresh leads" emptyIcon="⚡" emptyText="No fresh leads yet" />
    </div>
  )
}