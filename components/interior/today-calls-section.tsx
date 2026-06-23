'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Calendar } from 'lucide-react'

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
  companyId,
}: {
  todayCalls: Call[]
  leadMap: Record<string, any>
  cres: CRE[]
  istDateStr: string
  leadBase: string
  companyId: string
}) {
  const [selectedCRE, setSelectedCRE] = useState<string>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
  const [fromDate, setFromDate] = useState(istDateStr)
  const [toDate, setToDate] = useState(istDateStr)
  const [historyCalls, setHistoryCalls] = useState<Call[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [histLeadMap, setHistLeadMap] = useState<Record<string, string>>({})
  const [historyCres, setHistoryCres] = useState<CRE[]>([])

  // ✅ FIX: selectedName history tab లో కూడా historyCres నుండి lookup చేస్తుంది
  const selectedName = selectedCRE === 'all'
    ? 'Total CRE'
    : (activeTab === 'today' ? cres : historyCres).find(c => c.id === selectedCRE)?.name || 'Total CRE'

  // Filter by CRE
  const filtered = (activeTab === 'today' ? todayCalls : historyCalls).filter(c =>
    selectedCRE === 'all' || c.user_id === selectedCRE
  )

  // Fetch history
  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const from = new Date(`${fromDate}T00:00:00+05:30`).toISOString()
      const to   = new Date(`${toDate}T23:59:59+05:30`).toISOString()

      // ✅ SECURITY FIX: company_id filter తో leads fetch చేసి, ఆ leadIds తో calls filter చేయి
      // Step 1: ఈ company leads తో leadIds తీసుకో
      const leadsUrl = `${SURL}/rest/v1/leads?company_id=eq.${companyId}&industry=eq.interior-design&select=id,lead_name`
      const leadsRes = await fetch(leadsUrl, { headers:{ apikey:SKEY, Authorization:`Bearer ${SKEY}` } })
      if (!leadsRes.ok) return
      const companyLeads = await leadsRes.json()
      const companyLeadIds = new Set(companyLeads.map((l: any) => l.id))
      const newHistLeadMap: Record<string, string> = {}
      companyLeads.forEach((l: any) => { newHistLeadMap[l.id] = l.lead_name })

      // Step 2: date range లో calls fetch చేసి company leadIds తో filter చేయి
      const url = `${SURL}/rest/v1/lead_activities?select=id,lead_id,description,created_at,user_id&type=eq.call&created_at=gte.${encodeURIComponent(from)}&created_at=lte.${encodeURIComponent(to)}&order=created_at.desc&limit=500`
      const res = await fetch(url, { headers:{ apikey:SKEY, Authorization:`Bearer ${SKEY}` } })
      if (!res.ok) return

      const allData = await res.json()
      // ✅ Only this company's leads calls — cross-company data leak fix
      const data = (allData ?? []).filter((a: any) => companyLeadIds.has(a.lead_id))

      // ✅ FIX: First build creMap from existing `cres` prop
      const creMap: Record<string, string> = {}
      cres.forEach(c => { creMap[c.id] = c.name })

      // Step 1: employees table నుండి fetch (user_id + full_name)
      const userIds = [...new Set(data.map((a: any) => a.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        const empUrl = `${SURL}/rest/v1/employees?user_id=in.(${userIds.join(',')})&select=user_id,full_name`
        const empRes = await fetch(empUrl, { headers:{ apikey:SKEY, Authorization:`Bearer ${SKEY}` } })
        if (empRes.ok) {
          const emps = await empRes.json()
          emps.forEach((e: any) => { creMap[e.user_id] = e.full_name })
        }

        // Step 2: employees లో లేని user_ids → profiles table fallback
        const missingIds = userIds.filter((uid: string) => !creMap[uid])
        if (missingIds.length > 0) {
          const profUrl = `${SURL}/rest/v1/profiles?id=in.(${missingIds.join(',')})&select=id,full_name`
          const profRes = await fetch(profUrl, { headers:{ apikey:SKEY, Authorization:`Bearer ${SKEY}` } })
          if (profRes.ok) {
            const profs = await profRes.json()
            profs.forEach((p: any) => { creMap[p.id] = p.full_name })
          }
        }
      }

      // Map user_name using complete creMap
      const calls = data.map((a: any) => ({
        ...a,
        user_name: creMap[a.user_id] || null,
        lead_name_override: newHistLeadMap[a.lead_id] || null,
      }))
      setHistoryCalls(calls)
      setHistLeadMap(newHistLeadMap)

      // ✅ FIX: Build historyCres from complete creMap (not just calls with user_name)
      const histCreMap: Record<string, string> = {}
      calls.forEach((a: any) => {
        if (a.user_id && creMap[a.user_id]) {
          histCreMap[a.user_id] = creMap[a.user_id]
        }
      })
      setHistoryCres(Object.entries(histCreMap).map(([id, name]) => ({ id, name: name as string })))

      // ✅ Reset CRE selection to 'all' when new history is loaded
      setSelectedCRE('all')

    } catch (e) { console.error(e) }
    finally { setHistoryLoading(false) }
  }

  // Breakup
  const getCats = (calls: Call[]) => {
    const cats = {
      rnr:       { label:'RNR',        icon:'📵', color:'#DC2626', bg:'#FEF2F2', count:0 },
      followup:  { label:'Follow Up',  icon:'🔔', color:'#D97706', bg:'#FFFBEB', count:0 },
      sitevisit: { label:'Site Visit', icon:'🏠', color:'#0891B2', bg:'#ECFEFF', count:0 },
      quotation: { label:'Quotation',  icon:'💰', color:'#DB2777', bg:'#FDF2F8', count:0 },
      won:       { label:'Won',        icon:'🏆', color:'#059669', bg:'#ECFDF5', count:0 },
      lost:      { label:'Lost',       icon:'❌', color:'#6B7280', bg:'#F9FAFB', count:0 },
      other:     { label:'Other',      icon:'📞', color:'#7C3AED', bg:'#F5F3FF', count:0 },
    }
    calls.forEach(a => {
      const d = (a.description || '').toLowerCase()
      if (d.includes('ring no response') || d.includes('rnr')) cats.rnr.count++
      else if (d.includes('follow up') || d.includes('followup')) cats.followup.count++
      else if (d.includes('site visit')) cats.sitevisit.count++
      else if (d.includes('quotation')) cats.quotation.count++
      else if (d.includes('deal closed') || d.includes('won')) cats.won.count++
      else if (d.includes('not interested') || d.includes('dropped') || d.includes('lost')) cats.lost.count++
      else cats.other.count++
    })
    return Object.values(cats).filter(c => c.count > 0)
  }

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

  const activeCats = getCats(filtered)

  // ✅ Active CRE list based on tab
  const activeCres = activeTab === 'today' ? cres : historyCres

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderBottom:'1px solid #A7F3D0' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(22,163,74,0.2)' }}>📞</div>
          <div>
            <p className="text-sm font-black" style={{ color:'#14532D' }}>Calls</p>
            <p className="text-[9px]" style={{ color:'#16A34A' }}>{istDateStr} · IST</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CRE Dropdown */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background:'rgba(255,255,255,0.8)', border:'1px solid #A7F3D0', color:'#14532D' }}>
              <span className="max-w-[90px] truncate">{selectedName}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden min-w-[160px]"
                style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
                <button onClick={() => { setSelectedCRE('all'); setDropdownOpen(false) }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-green-50"
                  style={{ color: selectedCRE === 'all' ? '#16A34A' : '#1C1712', borderBottom:'1px solid #F0EBE0', background: selectedCRE === 'all' ? '#F0FDF4' : 'transparent' }}>
                  <span>Total CRE</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background:'#ECFDF5', color:'#16A34A' }}>
                    {activeTab === 'today' ? todayCalls.length : historyCalls.length}
                  </span>
                </button>
                {/* ✅ FIX: activeCres use చేస్తున్నాం — tab బట్టి correct list వస్తుంది */}
                {activeCres.map((cre, i) => {
                  const sourceCalls = activeTab === 'today' ? todayCalls : historyCalls
                  const cnt = sourceCalls.filter(c => c.user_id === cre.id).length
                  return (
                    <button key={cre.id} onClick={() => { setSelectedCRE(cre.id); setDropdownOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-green-50"
                      style={{ color: selectedCRE === cre.id ? '#16A34A' : '#1C1712', borderBottom: i < activeCres.length-1 ? '1px solid #F0EBE0' : 'none', background: selectedCRE === cre.id ? '#F0FDF4' : 'transparent' }}>
                      <span className="truncate max-w-[110px]">{cre.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full ml-2"
                        style={{ background: cnt > 0 ? '#ECFDF5' : '#F5F0E8', color: cnt > 0 ? '#16A34A' : '#9A8F82' }}>{cnt}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white"
            style={{ background:'linear-gradient(135deg,#16A34A,#047857)', boxShadow:'0 3px 10px rgba(22,163,74,0.35)' }}>
            {activeTab === 'today' ? todayCalls.length : historyCalls.length}
          </div>
        </div>
      </div>

      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor:'#F0EBE0' }}>
        <button onClick={() => { setActiveTab('today'); setSelectedCRE('all') }}
          className="flex-1 py-2.5 text-xs font-black transition-all"
          style={{ color: activeTab === 'today' ? '#16A34A' : '#9A8F82', borderBottom: activeTab === 'today' ? '2px solid #16A34A' : '2px solid transparent' }}>
          📅 Today
        </button>
        <button onClick={() => { setActiveTab('history'); setSelectedCRE('all') }}
          className="flex-1 py-2.5 text-xs font-black transition-all"
          style={{ color: activeTab === 'history' ? '#16A34A' : '#9A8F82', borderBottom: activeTab === 'history' ? '2px solid #16A34A' : '2px solid transparent' }}>
          📋 History
        </button>
      </div>

      {/* History Date Range */}
      {activeTab === 'history' && (
        <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom:'1px solid #F0EBE0', background:'#FAFAF8' }}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'#9A8F82' }}/>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="text-xs rounded-xl px-3 py-1.5 outline-none border"
            style={{ borderColor:'#E8E2D8', background:'#fff', color:'#1C1712' }}/>
          <span className="text-xs text-[#9A8F82]">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="text-xs rounded-xl px-3 py-1.5 outline-none border"
            style={{ borderColor:'#E8E2D8', background:'#fff', color:'#1C1712' }}/>
          <button onClick={fetchHistory} disabled={historyLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#16A34A,#047857)' }}>
            {historyLoading ? '...' : 'Search'}
          </button>
          {/* Quick filters */}
          {[
            { label:'Yesterday', days:1 },
            { label:'7 Days',    days:7 },
            { label:'30 Days',   days:30 },
          ].map(q => (
            <button key={q.label} onClick={() => {
              const to = new Date()
              const from = new Date()
              from.setDate(from.getDate() - q.days)
              setFromDate(from.toISOString().split('T')[0])
              setToDate(to.toISOString().split('T')[0])
            }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors hover:bg-green-50"
              style={{ background:'#F0EBE0', color:'#7A6E60' }}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-3xl mb-2">📵</p>
          <p className="text-sm font-bold" style={{ color:'#374151' }}>
            {activeTab === 'today' ? 'No calls today' : 'No calls in selected range'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color:'#9A8F82' }}>
            {activeTab === 'history' ? 'Select date range and click Search' : 'Start calling your leads!'}
          </p>
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
          <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor:'#F0EBE0' }}>
            {filtered.map(act => {
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
                      <p className="text-xs font-bold truncate" style={{ color:'#1C1712' }}>
                        {(act as any).lead_name_override || lead?.lead_name || histLeadMap[act.lead_id] || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:badge.bg, color:badge.color }}>
                          {badge.icon} {act.description?.replace('Called — ','').split(' for ')[0].split(' ₹')[0] || 'Call'}
                        </span>
                      </div>
                      <span className="text-[9px]" style={{ color:'#9A8F82' }}>
                        {new Date(act.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                        {' · '}
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