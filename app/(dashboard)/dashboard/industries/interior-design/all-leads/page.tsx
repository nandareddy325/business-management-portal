'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users } from 'lucide-react'

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
  'new':         { bg: '#F5F3FF', color: '#7C3AED', label: '🆕 New Leads' },
  'new-leads':   { bg: '#F5F3FF', color: '#7C3AED', label: '🆕 New Leads' },
  'fresh-leads': { bg: '#F0FDF4', color: '#16A34A', label: '⚡ Fresh Leads' },
  'calling':     { bg: '#EFF6FF', color: '#2563EB', label: '📞 Calling' },
  'followup':    { bg: '#FFFBEB', color: '#D97706', label: '🔄 Follow Up' },
  'follow-up':   { bg: '#FFFBEB', color: '#D97706', label: '🔄 Follow Up' },
  'sitevisit':   { bg: '#ECFEFF', color: '#0891B2', label: '🏠 Site Visit' },
  'site-visit':  { bg: '#ECFEFF', color: '#0891B2', label: '🏠 Site Visit' },
  'quotation':   { bg: '#FDF2F8', color: '#DB2777', label: '💰 Quotations' },
  'quotations':  { bg: '#FDF2F8', color: '#DB2777', label: '💰 Quotations' },
  'won':         { bg: '#FFFBEB', color: '#B8860B', label: '🏆 Won' },
  'lost':        { bg: '#FEF2F2', color: '#DC2626', label: '❌ Lost' },
}

const STAGE_ORDER: Record<string, number> = {
  'calling': 1, 'followup': 2, 'follow-up': 2,
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

const UNIQUE_STAGES = [
  { key: 'new',         label: '🆕 New Leads' },
  { key: 'fresh-leads', label: '⚡ Fresh Leads' },
  { key: 'calling',     label: '📞 Calling' },
  { key: 'followup',    label: '🔄 Follow Up' },
  { key: 'sitevisit',   label: '🏠 Site Visit' },
  { key: 'quotation',   label: '💰 Quotations' },
  { key: 'won',         label: '🏆 Won' },
  { key: 'lost',        label: '❌ Lost' },
]

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchLeads = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return
      const { data } = await supabase
        .from('leads').select('*')
        .eq('company_id', profile.company_id)
        .eq('industry', 'interior-design')
        .order('created_at', { ascending: false })
      const sorted = [...(data ?? [])].sort((a, b) =>
        (STAGE_ORDER[a.pipeline_stage] ?? 99) - (STAGE_ORDER[b.pipeline_stage] ?? 99)
      )
      setLeads(sorted)
      setLoading(false)
    }
    fetchLeads()
  }, [])

  const matchStage = (lead: any, key: string) => {
    if (key === 'new') return lead.pipeline_stage === 'new' || lead.pipeline_stage === 'new-leads'
    if (key === 'followup') return lead.pipeline_stage === 'followup' || lead.pipeline_stage === 'follow-up'
    if (key === 'sitevisit') return lead.pipeline_stage === 'sitevisit' || lead.pipeline_stage === 'site-visit'
    if (key === 'quotation') return lead.pipeline_stage === 'quotation' || lead.pipeline_stage === 'quotations'
    return lead.pipeline_stage === key
  }

  const filteredLeads = activeFilter ? leads.filter(l => matchStage(l, activeFilter)) : leads
  const getCount = (key: string) => leads.filter(l => matchStage(l, key)).length

  const totalLeads  = leads.length
  const wonCount    = leads.filter(l => l.pipeline_stage === 'won').length
  const activeCount = totalLeads - wonCount - leads.filter(l => l.pipeline_stage === 'lost').length
  const convRate    = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">All Leads</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{filteredLeads.length}</span>{' '}
            {activeFilter ? `leads — ${STAGE_CONFIG[activeFilter]?.label}` : 'total leads — anni stages'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
          <Users className="w-4 h-4" />
          All Stages
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
          <p className="text-[#9A8F82] text-sm">Loading leads...</p>
        </div>
      ) : !filteredLeads.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <Users className="w-8 h-8 text-[#B8860B] mx-auto mb-3" />
          <p className="text-[#1C1712] font-bold">No leads found</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
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
                    <tr key={l.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
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
                          style={{ background: stg.bg, color: stg.color, border: `1px solid ${stg.color}30` }}>
                          {stg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {l.source ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>
                            {src.icon} {l.source}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.interest ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: int.bg, color: int.color, border: `1px solid ${int.color}30` }}>
                            {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
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

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {filteredLeads.map((l: any, i: number) => {
              const g   = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
              const stg = STAGE_CONFIG[l.pipeline_stage] ?? { bg: '#F5F0E8', color: '#7A6E60', label: l.pipeline_stage ?? '—' }
              const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
              const budget = (() => { const b = parseFloat(String(l.budget || '').replace(/[^0-9.]/g, '')); return l.budget ? (isNaN(b) ? l.budget : '₹' + b.toLocaleString('en-IN')) : null })()
              return (
                <div key={l.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
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