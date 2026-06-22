'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#B8860B', '#1C1712', '#D4A843', '#6B4F2A', '#E8C97A', '#4A3520', '#C9A227', '#8B6914']

const ACTIVITY_LABELS: Record<string, string> = {
  stage_change: 'Stage Changes',
  followup: 'Follow Ups',
  quotation: 'Quotations',
  call: 'Calls',
  note: 'Notes',
  sitevisit: 'Site Visits',
  won: 'Won',
}

const ACTIVITY_COLORS: Record<string, string> = {
  stage_change: '#0891B2',
  followup: '#F59E0B',
  quotation: '#DB2777',
  call: '#7C3AED',
  note: '#64748B',
  sitevisit: '#0E7490',
  won: '#10B981',
}

type Lead = {
  id: string
  source?: string | null
}

type LeadActivity = {
  id: string
  type?: string | null
  user_id?: string | null
  leads?: {
    city?: string | null
    source?: string | null
  } | null
}

type Profile = {
  id: string
  full_name?: string | null
  email?: string | null
}

export default function CREDashboardPage() {
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )

  const [leads, setLeads]   = useState<Lead[]>([])
  const [activities, setActivities]   = useState<LeadActivity[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo]     = useState(today)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) {
      setLoading(false)
      return
    }

    const [leadsRes, profilesRes, activitiesRes] = await Promise.all([
      supabase.from('leads').select('*')
        .eq('company_id', profile.company_id)
        .eq('industry', 'interior-design')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email')
        .eq('company_id', profile.company_id),
      supabase
        .from('lead_activities')
        .select('*, leads!inner(company_id, industry, city, source)')
        .eq('leads.company_id', profile.company_id)
        .eq('leads.industry', 'interior-design')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false }),
    ])

    setLeads((leadsRes.data ?? []) as Lead[])
    setProfiles((profilesRes.data ?? []) as Profile[])
    setActivities((activitiesRes.data ?? []) as LeadActivity[])
    setLoading(false)
  }, [dateFrom, dateTo, supabase])

  useEffect(() => {
    void Promise.resolve().then(fetchAll)
  }, [fetchAll])

  // ── Calculations ──

  // 1. Activity type breakdown
  const activityCounts: Record<string, number> = {}
  activities.forEach(activity => {
    const type = activity.type || 'unknown'
    activityCounts[type] = (activityCounts[type] || 0) + 1
  })
  const activityData = Object.entries(activityCounts).map(([key, value]) => ({
    name: ACTIVITY_LABELS[key] || key, value, key,
  }))

  // 2. User-wise breakdown
  const profileMap: Record<string, string> = {}
  profiles.forEach(p => { profileMap[p.id] = p.full_name || p.email || p.id })

  const userActivityMap: Record<string, Record<string, number>> = {}
  activities.forEach(activity => {
    const uid = activity.user_id || 'unknown'
    if (!userActivityMap[uid]) userActivityMap[uid] = {}
    const type = activity.type || 'unknown'
    userActivityMap[uid][type] = (userActivityMap[uid][type] || 0) + 1
    userActivityMap[uid]['total'] = (userActivityMap[uid]['total'] || 0) + 1
  })
  const userTableData = Object.entries(userActivityMap).map(([uid, counts]) => ({
    name: profileMap[uid] || uid.slice(0, 8) + '...',
    total: counts['total'] || 0,
    stage_change: counts['stage_change'] || 0,
    followup: counts['followup'] || 0,
    quotation: counts['quotation'] || 0,
    call: counts['call'] || 0,
    note: counts['note'] || 0,
    sitevisit: counts['sitevisit'] || 0,
  })).sort((a, b) => b.total - a.total)

  // 3. Source distribution
  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => { const s = l.source || 'Unknown'; sourceCounts[s] = (sourceCounts[s] || 0) + 1 })
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  // 4. City-wise activities
  const cityActivityCounts: Record<string, number> = {}
  activities.forEach(activity => {
    const city = activity.leads?.city || 'Unknown'
    cityActivityCounts[city] = (cityActivityCounts[city] || 0) + 1
  })
  const cityData = Object.entries(cityActivityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count).slice(0, 10)

  // Summary
  const totalActivities  = activities.length
  const totalFollowups   = activityCounts.followup || 0
  const totalQuotations  = activityCounts.quotation || 0
  const totalStageMoves  = activityCounts.stage_change || 0

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
            <p className="text-sm" style={{ color: '#6B4F2A' }}>Lead activity tracking and performance analytics</p>
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
              { label: 'Total Activities', value: totalActivities, color: '#B8860B', icon: '📋' },
              { label: 'Follow Ups',       value: totalFollowups,  color: '#D97706', icon: '🔔' },
              { label: 'Quotations',       value: totalQuotations, color: '#DB2777', icon: '💰' },
              { label: 'Stage Changes',    value: totalStageMoves, color: '#0891B2', icon: '🔀' },
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

          {/* Row 1: Activity Pie + City Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>📊 Activity Type Breakdown</h2>
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={activityData} cx="40%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value">
                      {activityData.map((e, i) => <Cell key={i} fill={ACTIVITY_COLORS[e.key] || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-[#9A8F82]">No activities logged</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E2D8]">
              <h2 className="text-sm font-black mb-4" style={{ color: '#1C1712' }}>🏙️ Activities by City</h2>
              {cityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cityData} margin={{ bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" />
                    <XAxis dataKey="city" angle={-40} textAnchor="end" tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#9A8F82' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Activities" fill="#B8860B" radius={[4,4,0,0]} />
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
                    {['CRE Name','Total','Stage Changes','Follow Ups','Quotations','Calls','Notes','Site Visits'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[9px] font-black uppercase tracking-wider" style={{ color: '#9A8F82' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userTableData.map((row, i) => (
                    <tr key={i} className="border-t border-[#F0EBE0] hover:bg-[#FDFAF8]">
                      <td className="py-2.5 px-3 font-bold text-[#1C1712]">{row.name}</td>
                      <td className="py-2.5 px-3 font-black" style={{ color: '#B8860B' }}>{row.total}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-600">{row.stage_change}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600">{row.followup}</td>
                      <td className="py-2.5 px-3 font-bold text-pink-600">{row.quotation}</td>
                      <td className="py-2.5 px-3 text-purple-500">{row.call}</td>
                      <td className="py-2.5 px-3 text-gray-500">{row.note}</td>
                      <td className="py-2.5 px-3 text-blue-500">{row.sitevisit}</td>
                    </tr>
                  ))}
                  {userTableData.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-[#9A8F82]">No activities logged yet</td></tr>
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
