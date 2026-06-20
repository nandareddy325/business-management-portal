'use client'

import { useState } from 'react'
import { LeadDetailPanel } from '@/components/dashboard/lead-detail-panel'

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const SOURCE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Instagram:  { bg: '#FDF2F8', color: '#DB2777', icon: '📸' },
  Facebook:   { bg: '#EFF6FF', color: '#2563EB', icon: '📘' },
  WhatsApp:   { bg: '#F0FDF4', color: '#16A34A', icon: '💬' },
  Referral:   { bg: '#FFFBEB', color: '#D97706', icon: '🤝' },
  'Walk-in':  { bg: '#F5F3FF', color: '#7C3AED', icon: '🚶' },
  Google:     { bg: '#FEF2F2', color: '#DC2626', icon: '🔍' },
  Other:      { bg: '#F5F0E8', color: '#7A6E60', icon: '📌' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

interface Lead {
  id: string
  lead_name: string
  phone?: string
  email?: string
  source?: string
  budget?: string
  city?: string
  interest?: string
  created_at: string
}

export function NewLeadsTable({ leads, count }: { leads: Lead[]; count: number }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  return (
    <>
      {!leads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="text-[#1C1712] font-bold text-base">No new leads yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Add your first lead to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Lead', 'Email', 'Source', 'Budget', 'City', 'Date', 'Call'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l: any, i: number) => {
                  const g = GRADIENTS[i % GRADIENTS.length]
                  const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
                  return (
                    <tr key={l.id}
                      onClick={() => setSelectedLeadId(l.id)}
                      className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                      <td className="pl-5 pr-2 py-3.5">
                        <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                      </td>
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
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#7A6E60] max-w-[160px] truncate">{l.email ?? '—'}</p>
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
                        {l.budget ? (
                          <p className="text-sm font-bold" style={{ color: '#B8860B' }}>{l.budget}</p>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.city ? (
                          <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 pr-5" onClick={e => e.stopPropagation()}>
                        {l.phone ? (
                          <a href={`tel:${l.phone}`} className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
                              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </div>
                          </a>
                        ) : <span className="text-[#C4BAB0] text-center block">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {leads.map((l: any, i: number) => {
              const g = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
              return (
                <div key={l.id}
                  onClick={() => setSelectedLeadId(l.id)}
                  className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                      {ini(l.lead_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                        {l.budget && (
                          <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{l.budget}</p>
                        )}
                      </div>
                      <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 mt-0.5 w-fit">
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#F0FDF4' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-[#16A34A]">{l.phone ?? '—'}</p>
                      </a>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {l.source && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: src.bg, color: src.color }}>
                            {src.icon} {l.source}
                          </span>
                        )}
                        {l.city && <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>}
                        <span className="text-[10px] text-[#C4BAB0]">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{count ?? 0}</span> new leads
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onStageUpdate={() => {
            setSelectedLeadId(null)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}