import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

export const dynamic = 'force-dynamic'

export default async function WonPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads').select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'won')
    .order('created_at', { ascending: false })

  const totalRevenue = leads?.reduce((s, l: { budget?: string | number }) => s + Number(l.budget || 0), 0) ?? 0
  const thisMonth    = leads?.filter((l: { created_at: string }) => { const d = new Date(l.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Won / Closing 🏆</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> deals closed 🎉</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#FFFBEB', color: '#B8860B', border: '1px solid #FDE68A' }}>
          <Trophy className="w-4 h-4" />Won Stage
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Won',     value: String(count ?? 0), color: '#B8860B' },
          { label: 'This Month',    value: String(thisMonth), color: '#059669' },
          { label: 'Total Revenue', value: totalRevenue >= 100000 ? '₹' + (totalRevenue / 100000).toFixed(1) + 'L' : totalRevenue > 0 ? '₹' + totalRevenue.toLocaleString('en-IN') : '—', color: '#B8860B' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <LeadTable leads={leads ?? []} count={count ?? 0} footerText="deals won 🎉" emptyIcon="🏆" emptyText="No won deals yet" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'City', 'Notes', 'Date']} />
    </div>
  )
}