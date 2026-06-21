'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Phone, Users, TrendingUp, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#B8860B', '#1C1712', '#D4A843', '#6B4F2A', '#E8C97A', '#4A3520', '#C9A227', '#8B6914']

const OUTCOME_LABELS: Record<string, string> = {
  rnr: 'RNR',
  not_interested: 'Not Interested',
  callback_tomorrow: 'CB Tomorrow',
  callback_2weeks: 'CB 2 Weeks',
  callback_3months: 'CB 3 Months',
  interested: 'Interested',
}

const OUTCOME_COLORS: Record<string, string> = {
  rnr: '#EF4444',
  not_interested: '#6B7280',
  callback_tomorrow: '#F59E0B',
  callback_2weeks: '#3B82F6',
  callback_3months: '#8B5CF6',
  interested: '#10B981',
}

export default function CREDashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [leads, setLeads]   = useState<any[]>([])
  const [calls, setCalls]   = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo]     = useState(today)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return

    const leadIds: string[] = []

    const [leadsRes, profilesRes] = await Promise.all([
      supabase.from('leads').select('*')
        .eq('company_id', profile.company_id)
        .eq('industry', 'interior-design')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59'),
      supabase.from('profiles').select('id, full_name, email')
        .eq('company_id', profile.company_id),
    ])

    const allLeads = leadsRes.data ?? []
    allLeads.forEach((l: any) => leadIds.push(l.id))
    setLeads(allLeads)
    setProfiles(profilesRes.data ?? [])

    if (leadIds.length > 0) {
      const { data: callsData } = await supabase
        .from('lead_activities')
        .select('*, leads(city, source)')
        .eq('type', 'call')
        .in('lead_id', leadIds)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
      setCalls(callsData ?? [])
    } else {
      setCalls([])
    }
    setLoading(false)
  }

  // ── Calculations ──

  // 1. Outcome breakdown
  const outcomeCounts: Record<string, number> = {}
  calls.forEach(c => {
    const o = c.outcome || 'unknown'
    outcomeCounts[o] = (outcomeCounts[o] || 0) + 1
  })
  const outcomeData = Object.entries(outcomeCounts).map(([key, value]) => ({
    name: OUTCOME_LABELS[key] || key, value, key,
  }))

  // 2. User-wise breakdown
  const profileMap: Record<string, string> = {}
  profiles.forEach((p: any) => { profileMap[p.id] = p.full_name || p.email || p.id })

  const userCallMap: Record<string, Record<string, number>> = {}
  calls.forEach(c => {
    const uid = c.user_id || 'unknown'
    if (!userCallMap[uid]) userCallMap[uid] = {}
    const o = c.outcome || 'unknown'
    userCallMap[uid][o] = (userCallMap[uid][o] || 0) + 1
    userCallMap[uid]['total'] = (userCallMap[uid]['total'] || 0) + 1
  })
  const userTableData = Object.entries(userCallMap).map(([uid, outcomes]) => ({
    name: profileMap[uid] || uid.slice(0, 8) + '...',
    total: outcomes['total'] || 0,
    rnr: outcomes['rnr'] || 0,
    not_interested: outcomes['not_interested'] || 0,
    callback_tomorrow: outcomes['callback_tomorrow'] || 0,
    callback_2weeks: outcomes['callback_2weeks'] || 0,
    callback_3months: outcomes['callback_3months'] || 0,
    interested: outcomes['interested'] || 0,
  })).sort((a, b) => b.total - a.total)

  // 3. Source distribution
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => { const s = l.source || 'Unknown'; sourceCounts[s] = (sourceCounts[s] || 0) + 1 })
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  // 4. City-wise calls
  const cityCallCounts: Record<string, number> = {}
  calls.forEach(c => { const city = c.leads?.city || 'Unknown'; cityCallCounts[city] = (cityCallCounts[city] || 0) + 1 })
  const cityData = Object.entries(cityCallCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count).slice(0, 10)

  // Summary
  const totalCalls       = calls.length
  const totalInterested  = calls.filter(c => c.outcome === 'interested').length
  const totalRNR         = calls.filter(c => c.outcome === 'rnr').length
  const activeUsers      = Object.keys(userCallMap).length

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#F5F0E8' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/industries/interior-design/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
            style={{ background: 'white', color: '#7A6E60', border: '1px solid #E8E2D8' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: '#B8860B' }}>Interior Design</p>
            <h1 className="text-2xl font-bold" style={{ color: '#1C1712' }}>CRE Dashboard</h1>
            <p className="text-sm" style={{ color: '#6B4F2A' }}>Call Tracking & Performance Analytics</p>
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
        <button onClick={fetchAll}
          className="px-4 py-2 rounded-xl text-sm font-black text-white flex items-center gap-2 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #B8860B, #D97706)', boxShadow: '0 4px 12px rgba(184,134,11,0.35)' }}>
          <RefreshCw size={14} /> Apply
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
              { label: 'Total Calls',      value: totalCalls,      color: '#B8860B', icon: '📞' },
              { label: 'Interested Leads', value: totalInterested, color: '#059669', icon: '✨' },
              { label: 'RNR',             value: totalRNR,         color: '#DC2626', icon: '📵' },
              { label: 'Active CREs',     value: activeUsers,      color: '#2563EB', icon: '👥' },
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

          {/* Row 1: Outcome Pie + City Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>📊 Call Outcomes Breakdown</h2>
              {outcomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={outcomeData} cx="40%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value">
                      {outcomeData.map((e, i) => <Cell key={i} fill={OUTCOME_COLORS[e.key] || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-[#9A8F82]">No calls logged</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>🏙️ Calls by City</h2>
              {cityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cityData} margin={{ bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                    <XAxis dataKey="city" angle={-40} textAnchor="end" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Calls" fill="#B8860B" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-[#9A8F82]">No data</div>
              )}
            </div>
          </div>

          {/* User Performance Table */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8] mb-5">
            <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>👤 CRE User-wise Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F5F0E8' }}>
                    {['CRE Name','Total','RNR','Not Int.','CB Tomorrow','CB 2W','CB 3M','Interested'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[9px] font-black uppercase tracking-wider" style={{ color: '#9A8F82' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userTableData.map((row, i) => (
                    <tr key={i} className="border-t border-[#F0EBE0] hover:bg-[#FDFAF8]">
                      <td className="py-2.5 px-3 font-bold text-[#1C1712]">{row.name}</td>
                      <td className="py-2.5 px-3 font-black" style={{ color: '#B8860B' }}>{row.total}</td>
                      <td className="py-2.5 px-3 font-bold text-red-500">{row.rnr}</td>
                      <td className="py-2.5 px-3 text-gray-500">{row.not_interested}</td>
                      <td className="py-2.5 px-3 text-amber-600">{row.callback_tomorrow}</td>
                      <td className="py-2.5 px-3 text-blue-500">{row.callback_2weeks}</td>
                      <td className="py-2.5 px-3 text-purple-500">{row.callback_3months}</td>
                      <td className="py-2.5 px-3 font-bold text-[#059669]">{row.interested}</td>
                    </tr>
                  ))}
                  {userTableData.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-[#9A8F82]">No calls logged yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
            <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>📍 Lead Sources Distribution</h2>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceData} cx="40%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value">
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-[#9A8F82]">No data</div>
            )}
          </div>

          <div className="text-center py-4 mt-4">
            <p className="text-[10px] text-[#C4BAB0]">GK CRM · CRE Dashboard · Interior Design</p>
          </div>
        </>
      )}
    </div>
  )
}