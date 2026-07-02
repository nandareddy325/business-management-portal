import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { SiteVisitClient } from '@/components/interior/site-visit-client'

export const dynamic = 'force-dynamic'

export default async function SiteVisitPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads').select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'sitevisit')
    .order('created_at', { ascending: false })

  // ✅ FIX: budget is stored as a string like "₹1,015" — strip non-numeric chars before summing
  const parseBudget = (b: any) => {
    if (!b) return 0
    const n = Number(String(b).replace(/[^0-9.]/g, ''))
    return isNaN(n) ? 0 : n
  }
  const totalBudget = leads?.reduce((s, l: any) => s + parseBudget(l.budget), 0) ?? 0

  // ✅ NEW: scheduled vs completed counts, based on sitevisit_status column
  const scheduledCount = leads?.filter((l: any) => l.sitevisit_status !== 'completed').length ?? 0
  const completedCount = leads?.filter((l: any) => l.sitevisit_status === 'completed').length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Site Visit</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#ECFEFF', color: '#0891B2', border: '1px solid #A5F3FC' }}>
          <MapPin className="w-4 h-4" />Site Visit Stage
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Visits',  value: count ?? 0,       color: '#0891B2' },
          { label: 'Scheduled',     value: scheduledCount,   color: '#D97706' },
          { label: 'Completed',     value: completedCount,   color: '#059669' },
          { label: 'Total Budget',  value: totalBudget >= 100000 ? '₹' + (totalBudget / 100000).toFixed(1) + 'L' : totalBudget > 0 ? '₹' + totalBudget.toLocaleString('en-IN') : '—', color: '#B8860B' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <SiteVisitClient leads={leads ?? []} count={count ?? 0} />
    </div>
  )
}