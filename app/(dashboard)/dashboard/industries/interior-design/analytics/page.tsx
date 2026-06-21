'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { ArrowLeft, TrendingUp, Users, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#7C3AED','#0891B2','#D97706','#DB2777','#059669','#DC2626','#2563EB','#EA580C','#64748B','#B8860B']

const STAGE_LABELS: Record<string, string> = {
  new: 'New', followup: 'Follow Up', rnr: 'RNR',
  sitevisit: 'Site Visit', quotation: 'Quotation', won: 'Won', lost: 'Lost'
}

const fmtBudget = (n: number) => n >= 100000 ? '₹' + (n/100000).toFixed(1) + 'L' : '₹' + n.toLocaleString('en-IN')

export default function AnalyticsDashboard() {
  const [leads, setLeads]       = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [dateRange, setDateRange] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => { fetchData() }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return

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
    setLeads(leadsData ?? [])

    // Fetch activities
    const leadIds = (leadsData ?? []).map((l: any) => l.id)
    if (leadIds.length > 0) {
      const { data: acts } = await supabase
        .from('lead_activities').select('*').in('lead_id', leadIds)
      setActivities(acts ?? [])
    }
    setLoading(false)
  }

  // ── Computed Stats ──
  const totalLeads  = leads.length
  const wonLeads    = leads.filter(l => l.pipeline_stage === 'won').length
  const lostLeads   = leads.filter(l => l.pipeline_stage === 'lost').length
  const activeLeads = totalLeads - wonLeads - lostLeads
  const convRate    = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'
  const totalBudget = leads.reduce((s, l) => {
    const b = parseFloat(String(l.budget || '0').replace(/[^0-9.]/g, ''))
    return s + (isNaN(b) ? 0 : b)
  }, 0)
  const totalCalls  = activities.filter(a => a.type === 'call').length

  // ── Source Distribution ──
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => {
    const s = l.source || 'Unknown'
    sourceCounts[s] = (sourceCounts[s] || 0) + 1
  })
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value, pct: ((value / totalLeads) * 100).toFixed(1) }))
    .sort((a, b) => b.value - a.value)

  // ── Stage Distribution ──
  const stageCounts: Record<string, number> = {}
  leads.forEach(l => {
    const s = l.pipeline_stage || 'new'
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })
  const stageData = Object.entries(stageCounts)
    .map(([stage, count]) => ({ stage: STAGE_LABELS[stage] || stage, count, stage_key: stage }))
    .sort((a, b) => b.count - a.count)

  // ── City-wise Performance ──
  const cityCounts: Record<string, { leads: number; won: number; calls: number }> = {}
  leads.forEach(l => {
    const c = l.city || 'Unknown'
    if (!cityCounts[c]) cityCounts[c] = { leads: 0, won: 0, calls: 0 }
    cityCounts[c].leads++
    if (l.pipeline_stage === 'won') cityCounts[c].won++
  })
  const cityData = Object.entries(cityCounts)
    .map(([city, d]) => ({ city, ...d, convRate: d.leads > 0 ? ((d.won / d.leads) * 100).toFixed(1) : '0' }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 12)

  // ── Daily Leads (last 14 days) ──
  const dailyMap: Record<string, number> = {}
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    dailyMap[d.toISOString().split('T')[0]] = 0
  }
  leads.forEach(l => {
    const d = l.created_at?.split('T')[0]
    if (d && dailyMap[d] !== undefined) dailyMap[d]++
  })
  const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    count
  }))

  // ── Interest Distribution ──
  const interestCounts: Record<string, number> = {}
  leads.forEach(l => {
    if (l.interest) interestCounts[l.interest] = (interestCounts[l.interest] || 0) + 1
  })
  const interestData = Object.entries(interestCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-xl text-xs font-bold shadow-xl"
          style={{ background: '#1C1712', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="mb-1 text-[#B8860B]">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <style>{`
        .chart-card { background: white; border: 1px solid #E8E2D8; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(28,23,18,0.06); }
        .chart-header { padding: 16px 20px; border-bottom: 1px solid #F0EBE0; background: #FAFAF8; }
        .stat-card { background: white; border: 1px solid #E8E2D8; border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(28,23,18,0.05); }
      `}</style>

      {/* Header */}
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

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            {[
              { label: 'All Time', value: 'all' },
              { label: '7 Days',   value: '7' },
              { label: '30 Days',  value: '30' },
              { label: '90 Days',  value: '90' },
            ].map(d => (
              <button key={d.value} onClick={() => setDateRange(d.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: dateRange === d.value ? '#B8860B' : 'rgba(255,255,255,0.08)',
                  color: dateRange === d.value ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${dateRange === d.value ? '#B8860B' : 'rgba(255,255,255,0.1)'}`,
                }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Leads',   value: totalLeads,         color: '#7C3AED', icon: '👥', sub: 'All time' },
                { label: 'Active',        value: activeLeads,        color: '#2563EB', icon: '⚡', sub: 'In pipeline' },
                { label: 'Won',           value: wonLeads,           color: '#059669', icon: '🏆', sub: `${convRate}% rate` },
                { label: 'Lost',          value: lostLeads,          color: '#DC2626', icon: '❌', sub: 'Dropped' },
                { label: 'Total Calls',   value: totalCalls,         color: '#D97706', icon: '📞', sub: 'Activities' },
                { label: 'Pipeline',      value: fmtBudget(totalBudget), color: '#B8860B', icon: '💰', sub: 'Combined', isStr: true },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: s.color }}>
                    {(s as any).isStr ? s.value : s.value.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#B8B0A0] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Row 1: Source + Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Lead Source Distribution */}
              <div className="chart-card">
                <div className="chart-header">
                  <p className="text-sm font-black text-[#1C1712]">📍 Lead Source Distribution</p>
                  <p className="text-[10px] text-[#9A8F82] mt-0.5">{totalLeads} total leads</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                          {sourceData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5 max-h-[160px] overflow-y-auto">
                      {sourceData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <p className="text-[10px] font-medium text-[#7A6E60] truncate">{d.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <p className="text-[10px] font-black text-[#1C1712]">{d.value}</p>
                            <p className="text-[9px] text-[#B8B0A0]">({d.pct}%)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage Distribution */}
              <div className="chart-card">
                <div className="chart-header">
                  <p className="text-sm font-black text-[#1C1712]">🎯 Pipeline Stage Distribution</p>
                  <p className="text-[10px] text-[#9A8F82] mt-0.5">Leads per stage</p>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stageData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                      <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Leads" radius={[6,6,0,0]}>
                        {stageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Daily Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <p className="text-sm font-black text-[#1C1712]">📈 Daily Lead Addition (Last 14 Days)</p>
                <p className="text-[10px] text-[#9A8F82] mt-0.5">Leads added per day</p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dailyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Leads" stroke="#B8860B" strokeWidth={2.5} dot={{ fill: '#B8860B', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3: City Performance */}
            <div className="chart-card">
              <div className="chart-header flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#1C1712]">🏙️ City-wise Performance</p>
                  <p className="text-[10px] text-[#9A8F82] mt-0.5">Top {cityData.length} cities by lead count</p>
                </div>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cityData} margin={{ top: 5, right: 20, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                    <XAxis dataKey="city" tick={{ fontSize: 8, fill: '#9A8F82' }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Bar dataKey="leads" name="Total Leads" fill="#7C3AED" radius={[4,4,0,0]} />
                    <Bar dataKey="won" name="Won" fill="#059669" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 4: City Table */}
            <div className="chart-card">
              <div className="chart-header">
                <p className="text-sm font-black text-[#1C1712]">📊 City-wise Detailed Table</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                      {['City', 'Total Leads', 'Won', 'Lost', 'Active', 'Conv. Rate'].map(h => (
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
                        <td className="px-4 py-3"><span className="text-sm font-bold text-[#DC2626]">{c.leads - c.won - (leads.filter(l => l.city === c.city && l.pipeline_stage !== 'won' && l.pipeline_stage !== 'lost').length)}</span></td>
                        <td className="px-4 py-3"><span className="text-sm font-bold text-[#2563EB]">{leads.filter(l => l.city === c.city && !['won','lost'].includes(l.pipeline_stage)).length}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#F0EBE0] max-w-[80px]">
                              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(c.convRate), 100)}%`, background: parseFloat(c.convRate) > 10 ? '#059669' : parseFloat(c.convRate) > 5 ? '#D97706' : '#DC2626' }} />
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

            {/* Row 5: Interest/Requirement Distribution */}
            {interestData.length > 0 && (
              <div className="chart-card">
                <div className="chart-header">
                  <p className="text-sm font-black text-[#1C1712]">💡 Requirement / Interest Distribution</p>
                  <p className="text-[10px] text-[#9A8F82] mt-0.5">What customers want</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={interestData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2} dataKey="value">
                          {interestData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {interestData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <p className="text-xs text-[#7A6E60] truncate max-w-[140px]">{d.name}</p>
                          </div>
                          <p className="text-xs font-black text-[#1C1712]">{d.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-3">
              <p className="text-[10px] text-[#C4BAB0]">GK CRM · Interior Design Analytics · Real-time data</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}