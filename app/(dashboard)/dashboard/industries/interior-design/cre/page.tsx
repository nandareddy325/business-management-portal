'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const COLORS = ['#B8860B', '#1C1712', '#6B4F2A', '#D4A843', '#8B6914', '#E8C97A', '#4A3520', '#C9A227', '#7C3AED', '#0891B2']

export default function CREDashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [leads, setLeads]           = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [dateFrom, setDateFrom]     = useState('2026-01-01')
  const [dateTo, setDateTo]         = useState('2026-12-31')

  useEffect(() => { fetchData() }, [dateFrom, dateTo])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('industry', 'interior-design')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59')

    const leadIds = (leadsData ?? []).map((l: any) => l.id)

    let activitiesData: any[] = []
    if (leadIds.length > 0) {
      const { data: acts } = await supabase
        .from('lead_activities')
        .select('*, leads(city)')
        .eq('type', 'call')
        .in('lead_id', leadIds)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
      activitiesData = acts ?? []
    }

    setLeads(leadsData ?? [])
    setActivities(activitiesData)
    setLoading(false)
  }

  // ── Chart Data ──

  // 1. Lead Sources
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => {
    const src = l.source || 'Unknown'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 2. Call Attempts by City
  const cityCallMap: Record<string, { calls: number; uniqueLeads: Set<string> }> = {}
  activities.forEach(a => {
    const city = a.leads?.city || 'Unknown'
    if (!cityCallMap[city]) cityCallMap[city] = { calls: 0, uniqueLeads: new Set() }
    cityCallMap[city].calls++
    if (a.lead_id) cityCallMap[city].uniqueLeads.add(a.lead_id)
  })
  const callCityData = Object.entries(cityCallMap)
    .map(([city, d]) => ({ city, totalCalls: d.calls, uniqueLeads: d.uniqueLeads.size }))
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 15)

  // 3. Lead Conversion by City
  const cityLeadMap: Record<string, { total: number; converted: number }> = {}
  leads.forEach(l => {
    const city = l.city || 'Unknown'
    if (!cityLeadMap[city]) cityLeadMap[city] = { total: 0, converted: 0 }
    cityLeadMap[city].total++
    if (l.pipeline_stage === 'won') cityLeadMap[city].converted++
  })
  const conversionData = Object.entries(cityLeadMap)
    .map(([city, d]) => ({
      city,
      total: d.total,
      converted: d.converted,
      rate: d.total > 0 ? ((d.converted / d.total) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // 4. User Performance
  const userMap: Record<string, { attempts: number; confirmed: number }> = {}
  activities.forEach(a => {
    const user = a.user_id || 'Unassigned'
    if (!userMap[user]) userMap[user] = { attempts: 0, confirmed: 0 }
    userMap[user].attempts++
  })
  const userData = Object.entries(userMap)
    .map(([user, d]) => ({ user: user.slice(0, 8) + '...', attempts: d.attempts, confirmed: d.confirmed }))
    .sort((a, b) => b.attempts - a.attempts)

  // 5. Pipeline Stage
  const stageCounts: Record<string, number> = {}
  leads.forEach(l => {
    const s = l.pipeline_stage || 'new'
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })
  const stageData = Object.entries(stageCounts)
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count)

  // Summary
  const totalLeads     = leads.length
  const totalCalls     = activities.length
  const convertedLeads = leads.filter(l => l.pipeline_stage === 'won').length
  const uniqueCities   = new Set(leads.map((l: any) => l.city)).size

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#F5F0E8' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/industries/interior-design/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'white', color: '#7A6E60', border: '1px solid #E8E2D8' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: '#B8860B' }}>Interior Design</p>
            <h1 className="text-2xl font-bold" style={{ color: '#1C1712' }}>CRE Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center shadow-sm border border-[#E8E2D8]">
        <span className="font-bold text-sm" style={{ color: '#1C1712' }}>Date Range:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm outline-none"
          style={{ borderColor: '#B8860B', background: '#F7F5F1' }} />
        <span style={{ color: '#9A8F82' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm outline-none"
          style={{ borderColor: '#B8860B', background: '#F7F5F1' }} />
        <button onClick={fetchData}
          className="px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 12px rgba(184,134,11,0.35)' }}>
          Apply
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Leads',       value: totalLeads,     color: '#7C3AED', icon: '👥' },
              { label: 'Total Call Attempts',value: totalCalls,    color: '#1C1712', icon: '📞' },
              { label: 'Won / Converted',    value: convertedLeads,color: '#059669', icon: '🏆' },
              { label: 'Cities Covered',     value: uniqueCities,  color: '#B8860B', icon: '🏙️' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E2D8]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
                  <span className="text-base">{s.icon}</span>
                </div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Row 1: Source + Call Attempts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* Lead Sources Donut */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>📍 Lead Sources Distribution</h2>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={sourceData} cx="40%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value">
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-[#9A8F82]">No data</div>
              )}
            </div>

            {/* Call Attempts by City */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>📞 Call Attempts by City</h2>
              {callCityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={callCityData} margin={{ bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                    <XAxis dataKey="city" angle={-45} textAnchor="end" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="totalCalls"  name="Total Calls"   fill="#B8860B" radius={[4,4,0,0]} />
                    <Bar dataKey="uniqueLeads" name="Unique Leads"  fill="#1C1712" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-[#9A8F82]">No call data</div>
              )}
            </div>
          </div>

          {/* Row 2: Conversion Table + User Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* City Conversion Table */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>🏙️ Lead Conversion by City</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F5F0E8' }}>
                      {['City','Leads','Won','Rate %'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[9px] font-black uppercase tracking-wider" style={{ color: '#9A8F82' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {conversionData.map((row, i) => (
                      <tr key={i} className="border-t border-[#F0EBE0] hover:bg-[#FDFAF8]">
                        <td className="py-2 px-3 font-medium text-[#1C1712] capitalize">{row.city}</td>
                        <td className="py-2 px-3 font-black text-[#7C3AED]">{row.total}</td>
                        <td className="py-2 px-3 font-bold text-[#059669]">{row.converted}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: parseFloat(row.rate) > 10 ? '#DCFCE7' : '#FFFBEB',
                              color: parseFloat(row.rate) > 10 ? '#166534' : '#92400E'
                            }}>
                            {row.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {conversionData.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-[#9A8F82]">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Performance */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>👤 User-wise Call Performance</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F5F0E8' }}>
                      {['User','Attempts','Confirmed'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[9px] font-black uppercase tracking-wider" style={{ color: '#9A8F82' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userData.map((row, i) => (
                      <tr key={i} className="border-t border-[#F0EBE0] hover:bg-[#FDFAF8]">
                        <td className="py-2 px-3 font-medium text-[#1C1712]">{row.user}</td>
                        <td className="py-2 px-3 font-black" style={{ color: '#B8860B' }}>{row.attempts}</td>
                        <td className="py-2 px-3 font-bold text-[#059669]">{row.confirmed}</td>
                      </tr>
                    ))}
                    {userData.length === 0 && (
                      <tr><td colSpan={3} className="text-center py-8 text-[#9A8F82]">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
            <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>🎯 Pipeline Stage Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#9A8F82' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9A8F82' }} />
                <Tooltip />
                <Bar dataKey="count" name="Leads" fill="#B8860B" radius={[6,6,0,0]}>
                  {stageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center py-4 mt-4">
            <p className="text-[10px] text-[#C4BAB0]">GK CRM · CRE Dashboard · Interior Design</p>
          </div>
        </>
      )}
    </div>
  )
}