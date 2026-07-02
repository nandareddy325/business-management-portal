'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Users, Search, X, Calendar } from 'lucide-react'
import { matchStage, getStageCounts, UNIQUE_STAGES, type CanonicalStage } from '@/lib/stage-utils'
import { fetchAllLeads } from '@/lib/fetch-all-leads'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const SOURCE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Instagram:   { bg: '#FDF2F8', color: '#DB2777', icon: '📸' },
  Facebook:    { bg: '#EFF6FF', color: '#2563EB', icon: '📘' },
  WhatsApp:    { bg: '#F0FDF4', color: '#16A34A', icon: '💬' },
  Referral:    { bg: '#FFFBEB', color: '#D97706', icon: '🤝' },
  'Walk-in':   { bg: '#F5F3FF', color: '#7C3AED', icon: '🚶' },
  Google:      { bg: '#FEF2F2', color: '#DC2626', icon: '🔍' },
  Other:       { bg: '#F5F0E8', color: '#7A6E60', icon: '📌' },
}

const STAGE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  'new':        { bg: '#F5F3FF', color: '#7C3AED', label: '🆕 New Leads' },
  'new-leads':  { bg: '#F5F3FF', color: '#7C3AED', label: '🆕 New Leads' },
  'followup':   { bg: '#FFFBEB', color: '#D97706', label: '🔄 Follow Up' },
  'follow-up':  { bg: '#FFFBEB', color: '#D97706', label: '🔄 Follow Up' },
  'rnr':        { bg: '#FEF2F2', color: '#DC2626', label: '📵 RNR' },
  'sitevisit':  { bg: '#ECFEFF', color: '#0891B2', label: '🏠 Site Visit' },
  'site-visit': { bg: '#ECFEFF', color: '#0891B2', label: '🏠 Site Visit' },
  'quotation':  { bg: '#FDF2F8', color: '#DB2777', label: '💰 Quotations' },
  'quotations': { bg: '#FDF2F8', color: '#DB2777', label: '💰 Quotations' },
  'won':        { bg: '#FFFBEB', color: '#B8860B', label: '🏆 Won' },
  'lost':       { bg: '#FEF2F2', color: '#DC2626', label: '❌ Lost' },
}

const STAGE_ORDER: Record<string, number> = {
  'calling': 1, 'followup': 2, 'follow-up': 2, 'rnr': 2,
  'sitevisit': 3, 'site-visit': 3,
  'quotation': 4, 'quotations': 4,
  'fresh-leads': 5, 'new': 6, 'new-leads': 6,
  'won': 7, 'lost': 8,
}

const INTEREST_CONFIG: Record<string, { bg: string; color: string }> = {
  High:   { bg: '#F0FDF4', color: '#16A34A' },
  Medium: { bg: '#FFFBEB', color: '#D97706' },
  Low:    { bg: '#FEF2F2', color: '#DC2626' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const LEAD_BASE = '/dashboard/industries/interior-design/leads'

// Today in IST as YYYY-MM-DD
const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export default function AllLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<CanonicalStage | null>(null)

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('')

  // ── Date range ──
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dateActive, setDateActive] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return
    // Paginated fetch — bypasses Supabase's default 1000-row cap.
    // Confirmed via SQL: actual lead count is 1079, not 1000. A plain
    // .select('*') was silently truncating results here.
    const data = await fetchAllLeads(supabase, profile.company_id, 'interior-design', '*, notes')
    const sorted = [...(data ?? [])].sort((a, b) =>
      (STAGE_ORDER[a.pipeline_stage] ?? 99) - (STAGE_ORDER[b.pipeline_stage] ?? 99)
    )
    setLeads(sorted)
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  // ── Quick date presets ──
  const applyDatePreset = (days: number) => {
    const to = todayIST()
    const from = new Date()
    from.setDate(from.getDate() - days)
    const fromStr = from.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    setFromDate(fromStr)
    setToDate(to)
    setDateActive(true)
  }

  const clearDate = () => {
    setFromDate('')
    setToDate('')
    setDateActive(false)
  }

  // ── Combined filter ──
  const filteredLeads = useMemo(() => {
    let result = activeFilter ? leads.filter(l => matchStage(l, activeFilter)) : leads

    // Date range filter
    if (dateActive && (fromDate || toDate)) {
      result = result.filter(l => {
        const leadDate = l.created_at?.split('T')[0] ?? ''
        if (fromDate && leadDate < fromDate) return false
        if (toDate && leadDate > toDate) return false
        return true
      })
    }

    // Search filter — name + phone
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(l => {
        const name  = (l.lead_name || '').toLowerCase()
        const phone = (l.phone || '').replace(/\D/g, '')
        const qDigits = q.replace(/\D/g, '')
        return name.includes(q) || (qDigits.length >= 3 && phone.includes(qDigits))
      })
    }

    return result
  }, [leads, activeFilter, searchQuery, fromDate, toDate, dateActive])

  // Single pass, shared with Sidebar — guarantees identical numbers everywhere.
  const stageCounts = useMemo(() => getStageCounts(leads), [leads])
  const getCount = (key: CanonicalStage) => stageCounts[key]

  const totalLeads  = leads.length
  const wonCount    = stageCounts.won
  const activeCount = totalLeads - wonCount - stageCounts.lost
  const convRate    = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-4 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">All Leads</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
          <Users className="w-4 h-4" />All Stages
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: String(totalLeads),  color: '#7C3AED', icon: '👥' },
          { label: 'Active',      value: String(activeCount), color: '#2563EB', icon: '⚡' },
          { label: 'Won',         value: String(wonCount),    color: '#B8860B', icon: '🏆' },
          { label: 'Conversion',  value: convRate + '%',      color: '#059669', icon: '📈' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Date Range Bar ── */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-3 shadow-sm space-y-3">
  <div className="flex items-center gap-3 flex-wrap justify-between">

    {/* LEFT — Search */}
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2D9C8] bg-[#FAFAF8] focus-within:border-[#B8860B] transition-colors w-64 flex-shrink-0">
      <Search size={14} className="text-[#9A8F82] flex-shrink-0" />
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search by name or phone..."
        className="flex-1 text-sm bg-transparent outline-none text-[#1C1712] placeholder:text-[#B8B0A0]"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')}
          className="w-5 h-5 rounded-full bg-[#E2D9C8] flex items-center justify-center flex-shrink-0 hover:bg-[#D0C8B8] transition-colors">
          <X size={10} className="text-[#7A6E60]" />
        </button>
      )}
    </div>

    {/* RIGHT — Date */}
    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
      <Calendar size={13} className="text-[#9A8F82] flex-shrink-0" />
      <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setDateActive(true) }}
        className="text-xs rounded-xl px-3 py-1.5 border border-[#E2D9C8] bg-white text-[#1C1712] outline-none focus:border-[#B8860B] font-semibold" />
      <span className="text-xs text-[#9A8F82] font-semibold">to</span>
      <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setDateActive(true) }}
        className="text-xs rounded-xl px-3 py-1.5 border border-[#E2D9C8] bg-white text-[#1C1712] outline-none focus:border-[#B8860B] font-semibold" />
      {dateActive && (
        <button onClick={clearDate}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
          <X size={10} /> Clear
        </button>
      )}
    </div>

  </div>
</div>

      {/* Stage Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveFilter(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: !activeFilter ? '#1C1712' : '#F5F0E8', color: !activeFilter ? '#fff' : '#7A6E60', border: `1px solid ${!activeFilter ? '#1C1712' : '#E2D9C8'}` }}>
          👥 All
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
            style={{ background: !activeFilter ? 'rgba(255,255,255,0.2)' : '#E2D9C8', color: !activeFilter ? '#fff' : '#7A6E60' }}>
            {totalLeads}
          </span>
        </button>
        {UNIQUE_STAGES.map(({ key, label }) => {
          const cnt = getCount(key)
          if (!cnt) return null
          const cfg = STAGE_CONFIG[key]
          const isActive = activeFilter === key
          return (
            <button key={key} onClick={() => setActiveFilter(isActive ? null : key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: isActive ? cfg.color : cfg.bg, color: isActive ? '#fff' : cfg.color, border: `2px solid ${cfg.color}` }}>
              <span>{label}</span>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                style={{ background: isActive ? 'rgba(255,255,255,0.25)' : cfg.color, color: '#fff' }}>
                {cnt}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#9A8F82] text-sm">Loading leads...</p>
        </div>
      ) : !filteredLeads.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            {searchQuery ? <Search className="w-7 h-7 text-[#B8860B]" /> : <Users className="w-7 h-7 text-[#B8860B]" />}
          </div>
          <p className="text-[#1C1712] font-bold">
            {searchQuery ? `No results for "${searchQuery}"` : 'No leads found'}
          </p>
          <p className="text-[#9A8F82] text-xs mt-1">
            {searchQuery ? 'Try a different name or phone number' : dateActive ? 'Try a different date range' : 'Add leads to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Lead', 'Phone', 'Stage', 'Source', 'Interest', 'Budget', 'City', 'Date'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l: any, i: number) => {
                  const g   = GRADIENTS[i % GRADIENTS.length]
                  const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
                  const stg = STAGE_CONFIG[l.pipeline_stage] ?? { bg: '#F5F0E8', color: '#7A6E60', label: l.pipeline_stage ?? '—' }
                  const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
                  const budget = (() => { const b = parseFloat(String(l.budget || '').replace(/[^0-9.]/g, '')); return l.budget ? (isNaN(b) ? l.budget : '₹' + b.toLocaleString('en-IN')) : null })()
                  return (
                    <tr key={l.id}
                      onClick={() => router.push(`${LEAD_BASE}/${l.id}`)}
                      className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                      <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span></td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                            {ini(l.lead_name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                            {l.property_type && <p className="text-[10px] text-[#B8B0A0]">{l.property_type}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><p className="text-sm font-mono text-[#1C1712]">{l.phone ?? '—'}</p></td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: stg.bg, color: stg.color, border: `1px solid ${stg.color}30` }}>{stg.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {l.source
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>{src.icon} {l.source}</span>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.interest
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: int.bg, color: int.color, border: `1px solid ${int.color}30` }}>
                              {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}</span>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {budget ? <p className="text-sm font-bold" style={{ color: '#B8860B' }}>{budget}</p> : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.city ? <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span> : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {filteredLeads.map((l: any, i: number) => {
              const g   = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
              const stg = STAGE_CONFIG[l.pipeline_stage] ?? { bg: '#F5F0E8', color: '#7A6E60', label: l.pipeline_stage ?? '—' }
              const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
              const budget = (() => { const b = parseFloat(String(l.budget || '').replace(/[^0-9.]/g, '')); return l.budget ? (isNaN(b) ? l.budget : '₹' + b.toLocaleString('en-IN')) : null })()
              return (
                <div key={l.id}
                  onClick={() => router.push(`${LEAD_BASE}/${l.id}`)}
                  className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                      {ini(l.lead_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                        {budget && <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{budget}</p>}
                      </div>
                      <p className="text-xs text-[#9A8F82] mt-0.5">{l.phone ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: stg.bg, color: stg.color }}>{stg.label}</span>
                        {l.interest && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: int.bg, color: int.color }}>{l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}</span>}
                        {l.source && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: src.bg, color: src.color }}>{src.icon} {l.source}</span>}
                        {l.city && <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>}
                      </div>
                      <p className="text-[9px] text-[#B8B0A0] mt-1">
                        {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              Showing <span className="font-bold text-[#1C1712]">{filteredLeads.length}</span> of {totalLeads} leads
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}