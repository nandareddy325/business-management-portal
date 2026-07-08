import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { AnalyticsCharts } from '@/components/interior/analytics-charts'

export const dynamic = 'force-dynamic'

interface Lead {
  id: string
  pipeline_stage?: string | null
  source?: string | null
  budget?: string | number | null
  city?: string | null
  interest?: string | null
  created_at?: string | null
  [key: string]: unknown
}

interface LeadActivity {
  id: string
  lead_id: string
  type?: string | null
  [key: string]: unknown
}

const STAGE_LABELS: Record<string, string> = {
  new: 'New', followup: 'Follow Up', rnr: 'RNR',
  sitevisit: 'Site Visit', quotation: 'Quotation', won: 'Won', lost: 'Lost'
}

const fmtBudget = (n: number) => n >= 100000 ? '₹' + (n/100000).toFixed(1) + 'L' : '₹' + n.toLocaleString('en-IN')

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const dateRange = (params?.range as string) ?? 'all'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // Build query with date filter
  let query = supabase.from('leads').select('*')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  if (dateRange === '7') {
    const d = new Date(); d.setDate(d.getDate() - 7)
    query = query.gte('created_at', d.toISOString())
  } else if (dateRange === '30') {
    const d = new Date(); d.setDate(d.getDate() - 30)
    query = query.gte('created_at', d.toISOString())
  } else if (dateRange === '90') {
    const d = new Date(); d.setDate(d.getDate() - 90)
    query = query.gte('created_at', d.toISOString())
  }

  const { data: leadsData } = await query
  const allLeads: Lead[] = leadsData ?? []

  // Activities
  const leadIds = allLeads.map((l: Lead) => l.id)
  let allActivities: LeadActivity[] = []
  if (leadIds.length > 0) {
    const { data: acts } = await supabase
      .from('lead_activities').select('*').in('lead_id', leadIds)
    allActivities = acts ?? []
  }

  // ── Computed Stats ──
  const totalLeads  = allLeads.length
  const wonLeads    = allLeads.filter((l: Lead) => l.pipeline_stage === 'won').length
  const lostLeads   = allLeads.filter((l: Lead) => l.pipeline_stage === 'lost').length
  const activeLeads = totalLeads - wonLeads - lostLeads
  const convRate    = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'
  const totalBudget = allLeads.reduce((s: number, l: Lead) => {
    const b = parseFloat(String(l.budget || '0').replace(/[^0-9.]/g, ''))
    return s + (isNaN(b) ? 0 : b)
  }, 0)
  const totalCalls = allActivities.filter((a: LeadActivity) => a.type === 'call').length

  // ── Source Distribution ──
  const sourceCounts: Record<string, number> = {}
  allLeads.forEach((l: Lead) => {
    const s = l.source || 'Unknown'
    sourceCounts[s] = (sourceCounts[s] || 0) + 1
  })
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value, pct: ((value / totalLeads) * 100).toFixed(1) }))
    .sort((a, b) => b.value - a.value)

  // ── Stage Distribution ──
  const stageCounts: Record<string, number> = {}
  allLeads.forEach((l: Lead) => {
    const s = l.pipeline_stage || 'new'
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })
  const stageData = Object.entries(stageCounts)
    .map(([stage, count]) => ({ stage: STAGE_LABELS[stage] || stage, count }))
    .sort((a, b) => b.count - a.count)

  // ── City-wise ──
  const cityCounts: Record<string, { leads: number; won: number }> = {}
  allLeads.forEach((l: Lead) => {
    const c = l.city || 'Unknown'
    if (!cityCounts[c]) cityCounts[c] = { leads: 0, won: 0 }
    cityCounts[c].leads++
    if (l.pipeline_stage === 'won') cityCounts[c].won++
  })
  const cityData = Object.entries(cityCounts)
    .map(([city, d]) => ({ city, ...d, convRate: d.leads > 0 ? ((d.won / d.leads) * 100).toFixed(1) : '0', active: d.leads - d.won }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 12)

  // ── Daily Leads (last 14 days) ──
  const dailyMap: Record<string, number> = {}
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    dailyMap[d.toISOString().split('T')[0]] = 0
  }
  allLeads.forEach((l: Lead) => {
    const d = l.created_at?.split('T')[0]
    if (d && dailyMap[d] !== undefined) dailyMap[d]++
  })
  const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    count
  }))

  // ── Interest Distribution ──
  const interestCounts: Record<string, number> = {}
  allLeads.forEach((l: Lead) => {
    if (l.interest) interestCounts[l.interest] = (interestCounts[l.interest] || 0) + 1
  })
  const interestData = Object.entries(interestCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const kpis = [
    { label: 'Total Leads',  value: totalLeads,           color: '#7C3AED', icon: '👥', sub: 'All time',     isStr: false },
    { label: 'Active',       value: activeLeads,           color: '#2563EB', icon: '⚡', sub: 'In pipeline',  isStr: false },
    { label: 'Won',          value: wonLeads,              color: '#059669', icon: '🏆', sub: `${convRate}% rate`, isStr: false },
    { label: 'Lost',         value: lostLeads,             color: '#DC2626', icon: '❌', sub: 'Dropped',      isStr: false },
    { label: 'Total Calls',  value: totalCalls,            color: '#D97706', icon: '📞', sub: 'Activities',   isStr: false },
    { label: 'Pipeline',     value: fmtBudget(totalBudget), color: '#B8860B', icon: '💰', sub: 'Combined',   isStr: true  },
  ]

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      {/* Dark Header */}
      <div style={{ background: 'linear-gradient(135deg, #1C1712, #2d2218)', padding: '20px 24px' }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/industries/interior-design/dashboard"
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-0.5" style={{ color: '#B8860B' }}>Interior Design</p>
              <h1 className="text-xl font-black text-white">Analytics Dashboard</h1>
            </div>
          </div>
          {/* Date Range Filter — links instead of state */}
          <div className="flex items-center gap-2">
            {[
              { label: 'All Time', value: 'all' },
              { label: '7 Days',   value: '7' },
              { label: '30 Days',  value: '30' },
              { label: '90 Days',  value: '90' },
            ].map(d => (
              <Link key={d.value}
                href={`/dashboard/industries/interior-design/analytics?range=${d.value}`}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: dateRange === d.value ? '#B8860B' : 'rgba(255,255,255,0.08)',
                  color: dateRange === d.value ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${dateRange === d.value ? '#B8860B' : 'rgba(255,255,255,0.1)'}`,
                }}>
                {d.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((s, i) => (
            <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>
                {s.isStr ? s.value : (s.value as number).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#B8B0A0] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts — client component */}
        <AnalyticsCharts
          sourceData={sourceData}
          stageData={stageData}
          dailyData={dailyData}
          cityData={cityData}
          interestData={interestData}
        />

        {/* City Table — server rendered */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-sm font-black text-[#1C1712]">📊 City-wise Detailed Table</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['City', 'Total Leads', 'Won', 'Active', 'Lost', 'Conv. Rate'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cityData.map((c, i) => (
                  <tr key={i} className="border-b border-[#F7F5F1] hover:bg-[#FDFAF8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-[#B8860B]" />
                        <span className="text-sm font-bold text-[#1C1712]">{c.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-black text-[#7C3AED]">{c.leads}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-[#059669]">{c.won}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-[#2563EB]">{c.active}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-[#DC2626]">{c.leads - c.won - c.active}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#F0EBE0] max-w-[80px]">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${Math.min(parseFloat(c.convRate), 100)}%`,
                            background: parseFloat(c.convRate) > 10 ? '#059669' : parseFloat(c.convRate) > 5 ? '#D97706' : '#DC2626'
                          }} />
                        </div>
                        <span className="text-[10px] font-bold text-[#7A6E60]">{c.convRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-[10px] text-[#C4BAB0]">GK CRM · Interior Design Analytics · Real-time data</p>
        </div>
      </div>
    </div>
  )
}