'use client'

import { useState, useMemo } from 'react'
import { Search, X, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

interface Lead { id: string; lead_name: string; phone?: string; email?: string; source?: string; budget?: string; city?: string; interest?: string; notes?: string; date?: string; created_at: string }

export function FollowUpClient({ leads, count }: { leads: Lead[]; count: number }) {
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
        const ld = l.date ? new Date(l.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : ''
        if (!ld) return false
        if (fromDate && ld < fromDate) return false
        if (toDate && ld > toDate) return false
      }
      return true
    })
  }, [leads, searchQuery, fromDate, toDate, dateActive])

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const overdueLeads  = filteredLeads.filter(l => l.date && new Date(l.date) < today)
  const todayLeads    = filteredLeads.filter(l => l.date && new Date(l.date).toDateString() === today.toDateString())
  const tomorrowLeads = filteredLeads.filter(l => l.date && new Date(l.date).toDateString() === tomorrow.toDateString())
  const upcomingLeads = filteredLeads.filter(l => l.date && new Date(l.date) > tomorrow)
  const noDateLeads   = filteredLeads.filter(l => !l.date)

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
      {overdueLeads.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700">{overdueLeads.length} lead{overdueLeads.length > 1 ? 's' : ''} overdue — veelatho contact cheyyali!</p>
        </div>
      )}
      {todayLeads.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-bold text-green-700">{todayLeads.length} lead{todayLeads.length > 1 ? 's' : ''} today call cheyali!</p>
        </div>
      )}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">{searchQuery || dateActive ? 'No leads match your filter' : 'No follow-up leads'}</p>
          <p className="text-[#9A8F82] text-sm mt-1">{searchQuery || dateActive ? 'Try adjusting your search or date range' : 'Leads move here when follow-up date is set'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">⚠️</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#DC2626' }}>Overdue</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#DC2626' }}>{overdueLeads.length}</span>
              </div>
              <LeadTable leads={overdueLeads} count={overdueLeads.length} footerText="overdue leads" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="⚠️" emptyText="" />
            </div>
          )}
          {todayLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">📅</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#16A34A' }}>Today</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#16A34A' }}>{todayLeads.length}</span>
              </div>
              <LeadTable leads={todayLeads} count={todayLeads.length} footerText="today" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="📅" emptyText="" />
            </div>
          )}
          {tomorrowLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">🔜</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#D97706' }}>Tomorrow</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#D97706' }}>{tomorrowLeads.length}</span>
              </div>
              <LeadTable leads={tomorrowLeads} count={tomorrowLeads.length} footerText="tomorrow" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="🔜" emptyText="" />
            </div>
          )}
          {upcomingLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">📆</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#7C3AED' }}>Upcoming</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#7C3AED' }}>{upcomingLeads.length}</span>
              </div>
              <LeadTable leads={upcomingLeads} count={upcomingLeads.length} footerText="upcoming" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="📆" emptyText="" />
            </div>
          )}
          {noDateLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">❓</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#7A6E60' }}>No Date Set</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#7A6E60' }}>{noDateLeads.length}</span>
              </div>
              <LeadTable leads={noDateLeads} count={noDateLeads.length} footerText="no date" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="❓" emptyText="" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}