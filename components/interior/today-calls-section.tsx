'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase() || '?'

interface Call {
  id: string
  lead_id: string
  description: string
  created_at: string
  user_id: string
  user_name: string
}

interface CRE {
  id: string
  name: string
}

export function TodayCallsSection({
  todayCalls,
  leadMap,
  cres,
  istDateStr,
  leadBase,
}: {
  todayCalls: Call[]
  leadMap: Record<string, any>
  cres: CRE[]
  istDateStr: string
  leadBase: string
}) {
  const [selectedCRE, setSelectedCRE] = useState<string>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedName = selectedCRE === 'all'
    ? 'Total CRM'
    : cres.find(c => c.id === selectedCRE)?.name || 'Total CRM'

  const filtered = selectedCRE === 'all'
    ? todayCalls
    : todayCalls.filter(c => c.user_id === selectedCRE)

  // Breakup categories
  const cats = {
    rnr:       { label:'RNR',        icon:'📵', color:'#DC2626', bg:'#FEF2F2', count:0 },
    followup:  { label:'Follow Up',  icon:'🔔', color:'#D97706', bg:'#FFFBEB', count:0 },
    sitevisit: { label:'Site Visit', icon:'🏠', color:'#0891B2', bg:'#ECFEFF', count:0 },
    quotation: { label:'Quotation',  icon:'💰', color:'#DB2777', bg:'#FDF2F8', count:0 },
    won:       { label:'Won',        icon:'🏆', color:'#059669', bg:'#ECFDF5', count:0 },
    lost:      { label:'Lost',       icon:'❌', color:'#6B7280', bg:'#F9FAFB', count:0 },
    other:     { label:'Other',      icon:'📞', color:'#7C3AED', bg:'#F5F3FF', count:0 },
  }

  filtered.forEach((a) => {
    const d = (a.description || '').toLowerCase()
    if (d.includes('ring no response') || d.includes('rnr')) cats.rnr.count++
    else if (d.includes('follow up') || d.includes('followup')) cats.followup.count++
    else if (d.includes('site visit')) cats.sitevisit.count++
    else if (d.includes('quotation')) cats.quotation.count++
    else if (d.includes('deal closed') || d.includes('won')) cats.won.count++
    else if (d.includes('not interested') || d.includes('dropped') || d.includes('lost')) cats.lost.count++
    else cats.other.count++
  })

  const activeCats = Object.values(cats).filter(c => c.count > 0)

  const getBadge = (desc: string) => {
    const d = (desc || '').toLowerCase()
    if (d.includes('ring no response') || d.includes('rnr')) return { icon:'📵', color:'#DC2626', bg:'#FEF2F2' }
    if (d.includes('follow up') || d.includes('followup'))   return { icon:'🔔', color:'#D97706', bg:'#FFFBEB' }
    if (d.includes('site visit'))   return { icon:'🏠', color:'#0891B2', bg:'#ECFEFF' }
    if (d.includes('quotation'))    return { icon:'💰', color:'#DB2777', bg:'#FDF2F8' }
    if (d.includes('deal closed') || d.includes('won')) return { icon:'🏆', color:'#059669', bg:'#ECFDF5' }
    if (d.includes('not interested') || d.includes('dropped')) return { icon:'❌', color:'#6B7280', bg:'#F9FAFB' }
    return { icon:'📞', color:'#7C3AED', bg:'#F5F3FF' }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderBottom:'1px solid #A7F3D0' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(22,163,74,0.2)' }}>📞</div>
          <div>
            <p className="text-sm font-black" style={{ color:'#14532D' }}>Today's Calls</p>
            <p className="text-[9px]" style={{ color:'#16A34A' }}>{istDateStr} · IST</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CRE Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background:'rgba(255,255,255,0.8)', border:'1px solid #A7F3D0', color:'#14532D' }}>
              <span className="max-w-[100px] truncate">{selectedName}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden min-w-[160px]"
                style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
                {/* Total CRM */}
                <button
                  onClick={() => { setSelectedCRE('all'); setDropdownOpen(false) }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors hover:bg-green-50"
                  style={{ color: selectedCRE === 'all' ? '#16A34A' : '#1C1712', borderBottom:'1px solid #F0EBE0', background: selectedCRE === 'all' ? '#F0FDF4' : 'transparent' }}>
                  <span>Total CRM</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background:'#ECFDF5', color:'#16A34A' }}>
                    {todayCalls.length}
                  </span>
                </button>

                {/* Individual CREs */}
                {cres.map((cre, i) => {
                  const creCount = todayCalls.filter(c => c.user_id === cre.id).length
                  return (
                    <button key={cre.id}
                      onClick={() => { setSelectedCRE(cre.id); setDropdownOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors hover:bg-green-50"
                      style={{
                        color: selectedCRE === cre.id ? '#16A34A' : '#1C1712',
                        borderBottom: i < cres.length - 1 ? '1px solid #F0EBE0' : 'none',
                        background: selectedCRE === cre.id ? '#F0FDF4' : 'transparent'
                      }}>
                      <span className="truncate max-w-[110px]">{cre.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{ background: creCount > 0 ? '#ECFDF5' : '#F5F0E8', color: creCount > 0 ? '#16A34A' : '#9A8F82' }}>
                        {creCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Total count badge */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#16A34A,#047857)', boxShadow:'0 3px 10px rgba(22,163,74,0.35)' }}>
            {filtered.length}
          </div>
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}

      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-3xl mb-2">📵</p>
          <p className="text-sm font-bold" style={{ color:'#374151' }}>
            {selectedCRE === 'all' ? 'No calls today' : `No calls by ${selectedName} today`}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color:'#9A8F82' }}>Start calling your leads!</p>
        </div>
      ) : (
        <div>
          {/* Breakup chips */}
          <div className="px-4 py-3 flex flex-wrap gap-2" style={{ borderBottom:'1px solid #F0EBE0' }}>
            {activeCats.map(cat => (
              <div key={cat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background:cat.bg, border:`1px solid ${cat.color}25` }}>
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs font-bold" style={{ color:cat.color }}>{cat.label}</span>
                <span className="text-sm font-black" style={{ color:cat.color }}>{cat.count}</span>
              </div>
            ))}
          </div>

          {/* Call list */}
          <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor:'#F0EBE0' }}>
            {filtered.map((act) => {
              const lead = leadMap[act.lead_id]
              const badge = getBadge(act.description)
              return (
                <Link key={act.id} href={`${leadBase}/${act.lead_id}`}>
                  <div className="px-3 py-2.5 flex items-center gap-2.5 hover:bg-green-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,#16A34A,#047857)' }}>
                      {ini(lead?.lead_name || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color:'#1C1712' }}>{lead?.lead_name ?? 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:badge.bg, color:badge.color }}>
                          {badge.icon} {act.description?.replace('Called — ','').split(' for ')[0].split(' ₹')[0] || 'Call'}
                        </span>
                      </div>
                      <span className="text-[9px]" style={{ color:'#9A8F82' }}>
                        {new Date(act.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                        {act.user_name ? ` · ${act.user_name}` : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}