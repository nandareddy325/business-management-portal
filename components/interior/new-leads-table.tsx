'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Search, X, Calendar } from 'lucide-react'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const SOURCE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Instagram:  { bg: '#FDF2F8', color: '#DB2777', icon: '📸' },
  Facebook:   { bg: '#EFF6FF', color: '#2563EB', icon: '📘' },
  WhatsApp:   { bg: '#F0FDF4', color: '#16A34A', icon: '💬' },
  Referral:   { bg: '#FFFBEB', color: '#D97706', icon: '🤝' },
  Other:      { bg: '#F5F0E8', color: '#7A6E60', icon: '📌' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const LEAD_BASE = '/dashboard/industries/interior-design/leads'

interface Lead { id: string; lead_name: string; phone?: string; email?: string; source?: string; budget?: string; city?: string; interest?: string; created_at: string }

export function NewLeadsTable({ leads, count }: { leads: Lead[]; count: number }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dateActive, setDateActive] = useState(false)

  const clearDate = () => { setFromDate(''); setToDate(''); setDateActive(false) }

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = l.lead_name?.toLowerCase().includes(q)
        const matchPhone = l.phone?.toLowerCase().includes(q)
        if (!matchName && !matchPhone) return false
      }
      // Date filter
      if (dateActive && (fromDate || toDate)) {
        const leadDate = new Date(l.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        if (fromDate && leadDate < fromDate) return false
        if (toDate && leadDate > toDate) return false
      }
      return true
    })
  }, [leads, searchQuery, fromDate, toDate, dateActive])

  return (
    <>
      {/* Search + Date Filter Bar */}
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

            {/* Presets */}

            {dateActive && (
              <button onClick={clearDate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter summary */}
        {(searchQuery || dateActive) && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-[#9A8F82]">Showing</span>
            <span className="text-[10px] font-black text-[#1C1712]">{filteredLeads.length}</span>
            <span className="text-[10px] text-[#9A8F82]">of {count} leads</span>
            {searchQuery && (
              <span className="text-[10px] bg-[#F5F0E8] text-[#7A6E60] px-2 py-0.5 rounded-full border border-[#E2D9C8]">
                🔍 &quot;{searchQuery}&quot;
              </span>
            )}
            {dateActive && fromDate && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                📅 {fromDate} → {toDate || 'today'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {!filteredLeads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="text-[#1C1712] font-bold text-base">
            {searchQuery || dateActive ? 'No leads match your filter' : 'No new leads yet'}
          </p>
          <p className="text-[#9A8F82] text-sm mt-1">
            {searchQuery || dateActive ? 'Try adjusting your search or date range' : 'Add your first lead to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Lead', 'Phone', 'Email', 'Source', 'Budget', 'City', 'Date', 'Call'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l: Lead, i: number) => {
                  const g = GRADIENTS[i % GRADIENTS.length]
                  const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
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
                            {l.interest && <p className="text-[10px] text-[#B8B0A0] truncate max-w-[140px]">{l.interest}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {l.phone ? (
                          <a href={`tel:${l.phone}`} className="text-xs font-bold font-mono whitespace-nowrap hover:underline" style={{ color: '#1C1712' }}>
                            {l.phone}
                          </a>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5"><p className="text-xs text-[#7A6E60] max-w-[160px] truncate">{l.email ?? '—'}</p></td>
                      <td className="px-4 py-3.5">
                        {l.source ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>
                            {src.icon} {l.source}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.budget ? <p className="text-sm font-bold" style={{ color: '#B8860B' }}>{l.budget}</p>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.city ? <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 pr-5" onClick={e => e.stopPropagation()}>
                        {l.phone ? (
                          <a href={`tel:${l.phone}`} className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center hover:scale-110 transition-all"
                              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </div>
                          </a>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {filteredLeads.map((l: Lead, i: number) => {
              const g = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
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
                        {l.budget && <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{l.budget}</p>}
                      </div>
                      <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 mt-0.5 w-fit">
                        <p className="text-xs font-bold text-[#16A34A]">{l.phone ?? '—'}</p>
                      </a>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
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
              <span className="font-bold text-[#1C1712]">{filteredLeads.length}</span>
              {(searchQuery || dateActive) ? ` of ${count} leads` : ' new leads'}
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </>
  )
}