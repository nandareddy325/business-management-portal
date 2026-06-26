'use client'

import { useState, useMemo } from 'react'
import { Search, X, Calendar } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

interface Lead { id: string; lead_name: string; phone?: string; email?: string; source?: string; budget?: string; city?: string; interest?: string; notes?: string; date?: string; created_at: string }

export function RnrClient({ leads, count }: { leads: Lead[]; count: number }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [dateActive, setDateActive]   = useState(false)

  const clearDate = () => { setFromDate(''); setToDate(''); setDateActive(false) }

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!l.lead_name?.toLowerCase().includes(q) && !l.phone?.toLowerCase().includes(q)) return false
      }
      if (dateActive && (fromDate || toDate)) {
        const ld = new Date(l.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        if (fromDate && ld < fromDate) return false
        if (toDate && ld > toDate) return false
      }
      return true
    })
  }, [leads, searchQuery, fromDate, toDate, dateActive])

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-3 shadow-sm space-y-3">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2D9C8] bg-[#FAFAF8] focus-within:border-[#B8860B] transition-colors w-64 flex-shrink-0">
            <Search size={14} className="text-[#9A8F82] flex-shrink-0" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="flex-1 text-sm bg-transparent outline-none text-[#1C1712] placeholder:text-[#B8B0A0]" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-[#E2D9C8] flex items-center justify-center flex-shrink-0 hover:bg-[#D0C8B8] transition-colors">
                <X size={10} className="text-[#7A6E60]" />
              </button>
            )}
          </div>
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
        {(searchQuery || dateActive) && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-[#9A8F82]">Showing</span>
            <span className="text-[10px] font-black text-[#1C1712]">{filteredLeads.length}</span>
            <span className="text-[10px] text-[#9A8F82]">of {count} leads</span>
            {searchQuery && <span className="text-[10px] bg-[#F5F0E8] text-[#7A6E60] px-2 py-0.5 rounded-full border border-[#E2D9C8]">🔍 "{searchQuery}"</span>}
            {dateActive && fromDate && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">📅 {fromDate} → {toDate || 'today'}</span>}
          </div>
        )}
      </div>
      <LeadTable
        leads={filteredLeads}
        count={filteredLeads.length}
        footerText="RNR leads"
        emptyIcon="📵"
        emptyText={searchQuery || dateActive ? 'No leads match your filter' : 'No RNR leads — great work!'}
        showCall={true}
        columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'City', 'Notes', 'Date']}
      />
    </div>
  )
}