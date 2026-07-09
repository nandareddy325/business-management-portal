import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const stageColors: Record<string, { bg: string; text: string; bar: string }> = {
  new:        { bg: 'bg-slate-50',   text: 'text-slate-700',   bar: 'bg-slate-400' },
  called:     { bg: 'bg-purple-50',  text: 'text-purple-700',  bar: 'bg-purple-500' },
  followup:   { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-400' },
  sitevisit:  { bg: 'bg-orange-50',  text: 'text-orange-700',  bar: 'bg-orange-400' },
  quotation:  { bg: 'bg-blue-50',    text: 'text-blue-700',    bar: 'bg-blue-500' },
  won:        { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  lost:       { bg: 'bg-red-50',     text: 'text-red-600',     bar: 'bg-red-400' },
}

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const cid = profile.company_id

  const [
    { data: leadsByStage },
    { data: leadsBySource },
    { data: invoiceStats },
    { count: totalEmployees },
  ] = await Promise.all([
    supabase.from('leads').select('pipeline_stage').eq('company_id', cid),
    supabase.from('leads').select('source').eq('company_id', cid),
    supabase.from('invoices').select('amount, paid_amount, status').eq('company_id', cid),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', cid).eq('is_active', true),
  ])

  const stageSummary = (leadsByStage ?? []).reduce((acc: Record<string, number>, l) => {
    const s = l.pipeline_stage || 'new'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  const sourceSummary = (leadsBySource ?? []).reduce((acc: Record<string, number>, l) => {
    const src = l.source || 'Direct'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {})

  const revenue = (invoiceStats ?? []).reduce((acc, i: { amount?: number; paid_amount?: number; status?: string }) => {
    acc.total += Number(i.amount || 0)
    acc.collected += Number(i.paid_amount || 0)
    if (i.status === 'overdue') acc.overdue += Number(i.amount || 0) - Number(i.paid_amount || 0)
    return acc
  }, { total: 0, collected: 0, overdue: 0 })

  const totalLeads = (leadsByStage ?? []).length
  const wonLeads = stageSummary['won'] ?? 0
  const convRate = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0
  const collectionRate = revenue.total > 0 ? Math.round((revenue.collected / revenue.total) * 100) : 0

  // Sort sources by count
  const sortedSources = Object.entries(sourceSummary).sort(([, a], [, b]) => b - a)
  const sourceColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1C1712]">Reports</h1>
        <p className="text-sm text-[#7A6E60] mt-0.5">Business performance overview</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: totalLeads,              suffix: '',   color: 'text-[#1C1712]',   bg: 'bg-[#FDFAF4]',  icon: '🎯' },
          { label: 'Win Rate',       value: convRate,                suffix: '%',  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Total Revenue',  value: `₹${(revenue.total/1000).toFixed(1)}K`, suffix: '', color: 'text-[#B8860B]', bg: 'bg-amber-50', icon: '💰' },
          { label: 'Active Staff',   value: totalEmployees ?? 0,     suffix: '',   color: 'text-blue-600',    bg: 'bg-blue-50',    icon: '👥' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}{s.suffix}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Lead Pipeline Breakdown */}
        <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-[#1C1712]">Lead Pipeline</h2>
            <span className="text-xs text-[#7A6E60] bg-[#F0EBE0] px-2 py-1 rounded-lg font-medium">{totalLeads} total</span>
          </div>
          <div className="space-y-3">
            {Object.entries(stageSummary).sort(([, a], [, b]) => b - a).map(([stage, count]) => {
              const style = stageColors[stage] ?? stageColors['new']
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} capitalize`}>
                        {stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#1C1712]">{count}</span>
                      <span className="text-[10px] text-[#9A8F82]">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {!Object.keys(stageSummary).length && (
              <p className="text-[#B8A99A] text-sm text-center py-6">No lead data yet</p>
            )}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-[#1C1712]">Lead Sources</h2>
            <span className="text-xs text-[#7A6E60] bg-[#F0EBE0] px-2 py-1 rounded-lg font-medium">{sortedSources.length} sources</span>
          </div>
          <div className="space-y-3">
            {sortedSources.map(([source, count], i) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={source} className="flex items-center gap-3">
                  <p className="text-sm text-[#1C1712] font-medium w-24 truncate flex-shrink-0 capitalize">{source}</p>
                  <div className="flex-1 h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${sourceColors[i % sourceColors.length]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#1C1712] w-6 text-right">{count}</span>
                    <span className="text-[10px] text-[#9A8F82] w-8">{pct}%</span>
                  </div>
                </div>
              )
            })}
            {!sortedSources.length && (
              <p className="text-[#B8A99A] text-sm text-center py-6">No source data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-base text-[#1C1712]">Revenue Summary</h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${collectionRate >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {collectionRate}% collected
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total Billed', value: revenue.total,     color: 'text-[#1C1712]',   bg: 'bg-[#F5F0E8]' },
            { label: 'Collected',    value: revenue.collected, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending',      value: revenue.total - revenue.collected, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-xl p-4`}>
              <p className="text-xs text-[#7A6E60] font-medium mb-1">{s.label}</p>
              <p className={`text-xl font-bold font-serif ${s.color}`}>₹{s.value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        {/* Collection progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[#7A6E60] font-medium">Collection Progress</p>
            <p className="text-xs font-bold text-[#1C1712]">{collectionRate}%</p>
          </div>
          <div className="h-3 bg-[#F0EBE0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}