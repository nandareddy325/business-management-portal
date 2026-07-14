'use client'

import { useRouter } from 'next/navigation'

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

const INTEREST_CONFIG: Record<string, { bg: string; color: string }> = {
  High:   { bg: '#F0FDF4', color: '#16A34A' },
  Medium: { bg: '#FFFBEB', color: '#D97706' },
  Low:    { bg: '#FEF2F2', color: '#DC2626' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const LEAD_BASE = '/dashboard/industries/interior-design/leads'

interface TableLead {
  id: string
  lead_name: string
  phone?: string
  email?: string
  source?: string
  budget?: string | number
  city?: string
  interest?: string
  notes?: string
  date?: string
  created_at: string
  property_type?: string
  sitevisit_date?: string
  quotation_date?: string
}

interface Props {
  leads: TableLead[]
  count: number
  columns?: string[]
  emptyIcon?: string
  emptyText?: string
  footerText?: string
  showCall?: boolean
}

export function LeadTable({
  leads,
  count,
  columns = ['#', 'Lead', 'Phone', 'Source', 'Interest', 'Budget', 'City', 'Date'],
  emptyIcon = '👤',
  emptyText = 'No leads yet',
  footerText = 'leads',
  showCall = false,
}: Props) {
  const router = useRouter()

  // Parses budget text robustly instead of naively concatenating digits.
  // Handles: plain rupee numbers ("800000"), lakh/crore shorthand ("7.5 lacks", "5-8L"),
  // and ranges ("10 to 15 lacks") — without mangling "10 to 15" into "1015".
  const budget = (l: TableLead) => {
    if (!l.budget) return null
    let str = String(l.budget).trim()
    if (!str) return null

    // Indian-style thousands separators (e.g. "15,00,000") — strip so they don't
    // get mistaken for a range/list of separate numbers.
    str = str.replace(/(\d),(?=\d)/g, '$1')

    const hasCrore = /crore|\bcr\b/i.test(str)
    const hasLakh  = !hasCrore && /lakh|lac|\d\s*l\b/i.test(str)
    const multiplier = hasCrore ? 10000000 : hasLakh ? 100000 : 1

    const nums = (str.match(/\d+(\.\d+)?/g) || []).map(Number)
    if (nums.length === 0) return str // no digits at all — show the raw text as typed

    const fmt = (n: number) => '₹' + Math.round(n * multiplier).toLocaleString('en-IN')

    if (nums.length === 1) return fmt(nums[0])
    if (nums.length === 2) return `${fmt(nums[0])} – ${fmt(nums[1])}`
    return str // 3+ numbers is ambiguous — show raw text rather than guess wrong
  }

  const goToLead = (id: string) => {
    router.push(`${LEAD_BASE}/${id}`)
  }

  if (!leads?.length) return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
      <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">{emptyIcon}</span>
      </div>
      <p className="text-[#1C1712] font-bold text-base">{emptyText}</p>
    </div>
  )

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
              {[...columns, ...(showCall ? ['Call'] : [])].map(h => (
                <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l: TableLead, i: number) => {
              const g   = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
              const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
              const bgt = budget(l)
              
              return (
                <tr key={l.id}
                  onClick={() => goToLead(l.id)}
                  className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                  
                  {/* Render columns in the EXACT order they appear in the columns array */}
                  {columns.map((col) => {
                    // # Column
                    if (col === '#') {
                      return (
                        <td key={`${l.id}-${col}`} className="pl-5 pr-2 py-3.5">
                          <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                        </td>
                      )
                    }

                    // Lead Column
                    if (col === 'Lead') {
                      return (
                        <td key={`${l.id}-${col}`} className="pl-2 pr-4 py-3.5">
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
                      )
                    }

                    // Phone Column
                    if (col === 'Phone') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          <p className="text-sm font-mono text-[#1C1712]">{l.phone ?? '—'}</p>
                        </td>
                      )
                    }

                    // Email Column
                    if (col === 'Email') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          <p className="text-xs text-[#7A6E60] max-w-[140px] truncate">{l.email ?? '—'}</p>
                        </td>
                      )
                    }

                    // Follow-up Date Column
                    if (col === 'Follow-up Date') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          {l.date ? (
                            <p className="text-xs font-bold text-[#1C1712]">
                              {new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          ) : <span className="text-[10px] text-[#C4BAB0]">No date</span>}
                        </td>
                      )
                    }

                    // Site Visit Date Column (sitevisit_date)
                    if (col === 'Site Visit Date') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5 pr-5">
                          {l.sitevisit_date ? (
                            <p className="text-xs font-bold whitespace-nowrap" style={{ color: '#0891B2' }}>
                              {new Date(l.sitevisit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' '}
                              {new Date(l.sitevisit_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                          ) : <span className="text-[10px] text-[#C4BAB0]">Not scheduled</span>}
                        </td>
                      )
                    }

                    // Quotation Date Column (quotation_date)
                    if (col === 'Quotation Date') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5 pr-5">
                          {l.quotation_date ? (
                            <p className="text-xs font-bold whitespace-nowrap" style={{ color: '#DB2777' }}>
                              {new Date(l.quotation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          ) : <span className="text-[10px] text-[#C4BAB0]">Not sent</span>}
                        </td>
                      )
                    }

                    // Source Column
                    if (col === 'Source') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          {l.source ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>
                              {src.icon} {l.source}
                            </span>
                          ) : <span className="text-[#C4BAB0]">—</span>}
                        </td>
                      )
                    }

                    // Interest Column
                    if (col === 'Interest') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          {l.interest ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: int.bg, color: int.color, border: `1px solid ${int.color}30` }}>
                              {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}
                            </span>
                          ) : <span className="text-[#C4BAB0]">—</span>}
                        </td>
                      )
                    }

                    // Budget Column
                    if (col === 'Budget') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          {bgt ? <p className="text-sm font-bold" style={{ color: '#B8860B' }}>{bgt}</p>
                            : <span className="text-[#C4BAB0]">—</span>}
                        </td>
                      )
                    }

                    // City Column
                    if (col === 'City') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          {l.city ? <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>
                            : <span className="text-[#C4BAB0]">—</span>}
                        </td>
                      )
                    }

                    // Notes Column
                    if (col === 'Notes') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5">
                          <p className="text-xs text-[#7A6E60] max-w-[150px] truncate">{l.notes ?? '—'}</p>
                        </td>
                      )
                    }

                    // Date Column (created_at)
                    if (col === 'Date') {
                      return (
                        <td key={`${l.id}-${col}`} className="px-4 py-3.5 pr-5">
                          <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
                            {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                      )
                    }

                    return null
                  })}

                  {/* Call Column (if enabled) */}
                  {showCall && (
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
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-[#F0EBE0]">
        {leads.map((l: TableLead, i: number) => {
          const g   = GRADIENTS[i % GRADIENTS.length]
          const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
          const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
          const bgt = budget(l)
          return (
            <div key={l.id}
              onClick={() => goToLead(l.id)}
              className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                  {ini(l.lead_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                    {bgt && <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{bgt}</p>}
                  </div>
                  {showCall ? (
                    <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 mt-0.5 w-fit">
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: '#F0FDF4' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-[#16A34A]">{l.phone ?? '—'}</p>
                    </a>
                  ) : (
                    <p className="text-xs text-[#9A8F82] mt-0.5">{l.phone ?? '—'}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {l.source && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: src.bg, color: src.color }}>{src.icon} {l.source}</span>}
                    {l.interest && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: int.bg, color: int.color }}>{l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}</span>}
                    {l.city && <span className="text-[10px] text-[#7A6E60]">📍 {l.city}</span>}
                    {l.date && <span className="text-[10px] text-[#D97706]">📅 {new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                    {l.sitevisit_date && (
                      <span className="text-[10px] font-bold" style={{ color: '#0891B2' }}>
                        🏠 {new Date(l.sitevisit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' '}
                        {new Date(l.sitevisit_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    )}
                    {l.quotation_date && (
                      <span className="text-[10px] font-bold" style={{ color: '#DB2777' }}>
                        💰 {new Date(l.quotation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  {l.notes && <p className="text-[10px] text-[#9A8F82] mt-1.5 line-clamp-2">{l.notes}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
        <p className="text-[10px] text-[#9A8F82]">
          <span className="font-bold text-[#1C1712]">{count}</span> {footerText}
        </p>
        <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
      </div>
    </div>
  )
}