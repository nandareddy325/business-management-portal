'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, Calendar, Search, Phone, X } from 'lucide-react'

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const getISTDateStr = () => {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

const getISTOffsetDate = (daysBack: number): string => {
  const now = new Date()
  const istStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [y, m, d] = istStr.split('-').map(Number)
  const istDate = new Date(y, m - 1, d)
  istDate.setDate(istDate.getDate() - daysBack)
  const yr = istDate.getFullYear()
  const mo = String(istDate.getMonth() + 1).padStart(2, '0')
  const dy = String(istDate.getDate()).padStart(2, '0')
  return `${yr}-${mo}-${dy}`
}

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
  const [selectedCRE, setSelectedCRE]       = useState<string>('all')
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [activeTab, setActiveTab]           = useState<'today' | 'history'>('today')
  const [fromDate, setFromDate]             = useState(istDateStr)
  const [toDate, setToDate]                 = useState(istDateStr)
  const [historyCalls, setHistoryCalls]     = useState<Call[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [histLeadMap, setHistLeadMap]       = useState<Record<string, string>>({})
  const [histPhoneMap, setHistPhoneMap]     = useState<Record<string, string>>({})
  const [historyCres, setHistoryCres]       = useState<CRE[]>([])
  const [hasSearched, setHasSearched]       = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')

  const selectedName = selectedCRE === 'all'
    ? 'Total CRE'
    : (activeTab === 'today' ? cres : historyCres).find(c => c.id === selectedCRE)?.name || 'Total CRE'

  const sourceCalls = activeTab === 'today' ? todayCalls : historyCalls
  const creFiltered = sourceCalls.filter(c => selectedCRE === 'all' || c.user_id === selectedCRE)

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return creFiltered
    return creFiltered.filter(act => {
      const lead = leadMap[act.lead_id]
      const name = ((act as any).lead_name_override || lead?.lead_name || histLeadMap[act.lead_id] || '').toLowerCase()
      const phone = (lead?.phone || histPhoneMap[act.lead_id] || '').replace(/\D/g, '')
      const qDigits = q.replace(/\D/g, '')
      return name.includes(q) || (qDigits.length >= 3 && phone.includes(qDigits))
    })
  }, [creFiltered, searchQuery, leadMap, histLeadMap, histPhoneMap])

  const fetchHistory = async (overrideFrom?: string, overrideTo?: string) => {
    setHistoryLoading(true)
    setHasSearched(true)
    setSearchQuery('')
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const SKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const effectiveFrom = overrideFrom ?? fromDate
      const effectiveTo   = overrideTo   ?? toDate

      const from = new Date(`${effectiveFrom}T00:00:00+05:30`).toISOString()
      const to   = new Date(`${effectiveTo}T23:59:59+05:30`).toISOString()

      // ✅ FIX: leads fetch చేసి తర్వాత filter కాదు —
      // calls తో పాటు lead info ని ఒకే సారి తీసుకో (join via separate fetch)
      // Step 1: ఆ date range లో ALL calls తీసుకో (500 limit)
      const callsRes = await fetch(
        `${SURL}/rest/v1/lead_activities?select=id,lead_id,description,created_at,user_id&type=eq.call&created_at=gte.${encodeURIComponent(from)}&created_at=lte.${encodeURIComponent(to)}&order=created_at.desc&limit=500`,
        { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
      )
      if (!callsRes.ok) return
      const allCalls = await callsRes.json()
      if (!allCalls || allCalls.length === 0) {
        setHistoryCalls([])
        setHistLeadMap({})
        setHistPhoneMap({})
        setHistoryCres([])
        setSelectedCRE('all')
        return
      }

      // Step 2: ఆ calls లో ఉన్న unique lead_ids తీసుకో
      const leadIds = [...new Set(allCalls.map((a: any) => a.lead_id))] as string[]

      // Step 3: ఆ lead_ids లో company_id match అయినవి మాత్రమే తీసుకో
      // Supabase లో IN filter: id=in.(uuid1,uuid2,...)
      // 500 leads limit కోసం batch గా fetch చేయి
      const BATCH = 200
      const newHistLeadMap: Record<string, string> = {}
      const newHistPhoneMap: Record<string, string> = {}
      const validLeadIds = new Set<string>()

      for (let i = 0; i < leadIds.length; i += BATCH) {
        const batch = leadIds.slice(i, i + BATCH)
        const leadsRes = await fetch(
          `${SURL}/rest/v1/leads?id=in.(${batch.join(',')})&company_id=eq.${companyId}&select=id,lead_name,phone`,
          { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
        )
        if (!leadsRes.ok) continue
        const batchLeads = await leadsRes.json()
        batchLeads.forEach((l: any) => {
          validLeadIds.add(l.id)
          newHistLeadMap[l.id]  = l.lead_name
          newHistPhoneMap[l.id] = l.phone || ''
        })
      }

      // Step 4: valid lead_ids కి చెందిన calls మాత్రమే ఉంచు
      const data = allCalls.filter((a: any) => validLeadIds.has(a.lead_id))

      // Step 5: user names తీసుకో
      const creMap: Record<string, string> = {}
      cres.forEach(c => { creMap[c.id] = c.name })

      const userIds = [...new Set(data.map((a: any) => a.user_id).filter(Boolean))] as string[]
      if (userIds.length > 0) {
        const empRes = await fetch(
          `${SURL}/rest/v1/employees?user_id=in.(${userIds.join(',')})&select=user_id,full_name`,
          { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
        )
        if (empRes.ok) {
          const emps = await empRes.json()
          emps.forEach((e: any) => { creMap[e.user_id] = e.full_name })
        }
        const missingIds = userIds.filter((uid: string) => !creMap[uid])
        if (missingIds.length > 0) {
          const profRes = await fetch(
            `${SURL}/rest/v1/profiles?id=in.(${missingIds.join(',')})&select=id,full_name`,
            { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
          )
          if (profRes.ok) {
            const profs = await profRes.json()
            profs.forEach((p: any) => { creMap[p.id] = p.full_name })
          }
        }
      }

      const calls = data.map((a: any) => ({
        ...a,
        user_name: creMap[a.user_id] || null,
        lead_name_override: newHistLeadMap[a.lead_id] || null,
      }))

      setHistoryCalls(calls)
      setHistLeadMap(newHistLeadMap)
      setHistPhoneMap(newHistPhoneMap)

      const histCreMap: Record<string, string> = {}
      calls.forEach((a: any) => {
        if (a.user_id && creMap[a.user_id]) histCreMap[a.user_id] = creMap[a.user_id]
      })
      setHistoryCres(Object.entries(histCreMap).map(([id, name]) => ({ id, name: name as string })))
      setSelectedCRE('all')

    } catch (e) { console.error(e) }
    finally { setHistoryLoading(false) }
  }

  const getCats = (calls: Call[]) => {
    const cats = {
      rnr:       { label: 'RNR',        icon: '📵', color: '#DC2626', bg: '#FEF2F2', count: 0 },
      followup:  { label: 'Follow Up',  icon: '🔔', color: '#D97706', bg: '#FFFBEB', count: 0 },
      sitevisit: { label: 'Site Visit', icon: '🏠', color: '#0891B2', bg: '#ECFEFF', count: 0 },
      quotation: { label: 'Quotation',  icon: '💰', color: '#DB2777', bg: '#FDF2F8', count: 0 },
      won:       { label: 'Won',        icon: '🏆', color: '#059669', bg: '#ECFDF5', count: 0 },
      lost:      { label: 'Lost',       icon: '❌', color: '#6B7280', bg: '#F9FAFB', count: 0 },
      other:     { label: 'Other',      icon: '📞', color: '#7C3AED', bg: '#F5F3FF', count: 0 },
    }
    calls.forEach(a => {
      const d = (a.description || '').toLowerCase()
      if (d.includes('ring no response') || d.includes('rnr')) cats.rnr.count++
      else if (d.includes('follow up') || d.includes('followup')) cats.followup.count++
      else if (d.includes('site visit'))  cats.sitevisit.count++
      else if (d.includes('quotation'))   cats.quotation.count++
      else if (d.includes('deal closed') || d.includes('won')) cats.won.count++
      else if (d.includes('not interested') || d.includes('dropped') || d.includes('lost')) cats.lost.count++
      else cats.other.count++
    })
    return Object.values(cats).filter(c => c.count > 0)
  }

  const getBadge = (desc: string) => {
    const d = (desc || '').toLowerCase()
    if (d.includes('ring no response') || d.includes('rnr')) return { icon: '📵', color: '#DC2626', bg: '#FEF2F2' }
    if (d.includes('follow up') || d.includes('followup'))   return { icon: '🔔', color: '#D97706', bg: '#FFFBEB' }
    if (d.includes('site visit'))   return { icon: '🏠', color: '#0891B2', bg: '#ECFEFF' }
    if (d.includes('quotation'))    return { icon: '💰', color: '#DB2777', bg: '#FDF2F8' }
    if (d.includes('deal closed') || d.includes('won')) return { icon: '🏆', color: '#059669', bg: '#ECFDF5' }
    if (d.includes('not interested') || d.includes('dropped')) return { icon: '❌', color: '#6B7280', bg: '#F9FAFB' }
    return { icon: '📞', color: '#7C3AED', bg: '#F5F3FF' }
  }

  const activeCats = getCats(filtered)
  const activeCres = activeTab === 'today' ? cres : historyCres
  const totalCount = activeTab === 'today' ? todayCalls.length : historyCalls.length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E8E2D8', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderBottom: '1px solid #A7F3D0' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm"
            style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>📞</div>
          <div>
            <p className="text-sm font-black" style={{ color: '#14532D' }}>Calls</p>
            <p className="text-[9px] font-semibold" style={{ color: '#16A34A' }}>{istDateStr} · IST</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:shadow-sm"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #A7F3D0', color: '#14532D' }}>
              <span className="max-w-[90px] truncate">{selectedName}</span>
              <ChevronDown size={12} className="flex-shrink-0"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 rounded-2xl overflow-hidden min-w-[170px]"
                style={{ background: '#fff', border: '1px solid #E8E2D8', boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}>
                <button onClick={() => { setSelectedCRE('all'); setDropdownOpen(false) }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors hover:bg-green-50"
                  style={{ color: selectedCRE === 'all' ? '#16A34A' : '#1C1712', borderBottom: '1px solid #F0EBE0', background: selectedCRE === 'all' ? '#F0FDF4' : 'transparent' }}>
                  <span>Total CRE</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#16A34A' }}>{totalCount}</span>
                </button>
                {activeCres.map((cre, i) => {
                  const cnt = sourceCalls.filter(c => c.user_id === cre.id).length
                  return (
                    <button key={cre.id} onClick={() => { setSelectedCRE(cre.id); setDropdownOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors hover:bg-green-50"
                      style={{ color: selectedCRE === cre.id ? '#16A34A' : '#1C1712', borderBottom: i < activeCres.length - 1 ? '1px solid #F0EBE0' : 'none', background: selectedCRE === cre.id ? '#F0FDF4' : 'transparent' }}>
                      <span className="truncate max-w-[110px]">{cre.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full ml-2"
                        style={{ background: cnt > 0 ? '#ECFDF5' : '#F5F0E8', color: cnt > 0 ? '#16A34A' : '#9A8F82' }}>{cnt}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#16A34A,#047857)', boxShadow: '0 3px 10px rgba(22,163,74,0.4)' }}>
            {totalCount}
          </div>
        </div>
      </div>

      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #F0EBE0', background: '#FAFAF8' }}>
        {(['today', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSelectedCRE('all'); setSearchQuery('') }}
            className="flex-1 py-2.5 text-xs font-black transition-all"
            style={{ color: activeTab === tab ? '#16A34A' : '#9A8F82', borderBottom: activeTab === tab ? '2px solid #16A34A' : '2px solid transparent' }}>
            {tab === 'today' ? '📅 Today' : '📋 History'}
          </button>
        ))}
      </div>

      {/* History Controls */}
      {activeTab === 'history' && (
        <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: '1px solid #F0EBE0', background: '#FAFAF8' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={13} style={{ color: '#9A8F82' }} className="flex-shrink-0" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="text-xs rounded-xl px-3 py-1.5 outline-none border font-semibold"
              style={{ borderColor: '#E8E2D8', background: '#fff', color: '#1C1712' }} />
            <span className="text-xs font-semibold" style={{ color: '#9A8F82' }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="text-xs rounded-xl px-3 py-1.5 outline-none border font-semibold"
              style={{ borderColor: '#E8E2D8', background: '#fff', color: '#1C1712' }} />
            <button onClick={() => fetchHistory()} disabled={historyLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-black text-white disabled:opacity-50 transition-all active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#16A34A,#047857)' }}>
              {historyLoading
                ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</span>
                : 'Search'}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold" style={{ color: '#9A8F82' }}>Quick:</span>
            {[
              { label: 'Yesterday', days: 1,  single: true  },
              { label: '7 Days',    days: 7,  single: false },
              { label: '30 Days',   days: 30, single: false },
            ].map(q => (
              <button key={q.label} onClick={() => {
                const fromStr = getISTOffsetDate(q.days)
                const toStr   = q.single ? fromStr : getISTDateStr()
                setFromDate(fromStr)
                setToDate(toStr)
                fetchHistory(fromStr, toStr)
              }}
                className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-green-50 active:scale-95"
                style={{ background: '#F0EBE0', color: '#7A6E60', border: '1px solid #E8E2D8' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      {(activeTab === 'today' ? todayCalls.length > 0 : historyCalls.length > 0) && (
        <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #F0EBE0', background: '#FAFAF8' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
            style={{ background: '#fff', border: '1px solid #E8E2D8' }}>
            <Search size={12} style={{ color: '#9A8F82' }} className="flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="flex-1 text-xs outline-none bg-transparent font-medium"
              style={{ color: '#1C1712' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-gray-100">
                <X size={10} style={{ color: '#9A8F82' }} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] mt-1.5 font-semibold" style={{ color: '#9A8F82' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === 'history' && !hasSearched ? (
        <div className="py-12 text-center px-4">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
            style={{ background: '#F0FDF4', border: '1px solid #A7F3D0' }}>📋</div>
          <p className="text-sm font-bold" style={{ color: '#374151' }}>Select date range and search</p>
          <p className="text-[10px] mt-1" style={{ color: '#9A8F82' }}>Or click Yesterday · 7 Days · 30 Days</p>
        </div>

      ) : filtered.length === 0 ? (
        <div className="py-10 text-center px-4">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {searchQuery ? '🔍' : '📵'}
          </div>
          <p className="text-sm font-bold" style={{ color: '#374151' }}>
            {searchQuery ? `No results for "${searchQuery}"` : activeTab === 'today' ? 'No calls today' : 'No calls in selected range'}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#9A8F82' }}>
            {searchQuery ? 'Try a different name or phone' : activeTab === 'history' ? 'Try a different date range' : 'Start calling your leads!'}
          </p>
        </div>

      ) : (
        <div>
          {/* Category chips */}
          <div className="px-4 py-3 flex flex-wrap gap-2" style={{ borderBottom: '1px solid #F0EBE0' }}>
            {activeCats.map(cat => (
              <div key={cat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: cat.bg, border: `1px solid ${cat.color}20` }}>
                <span className="text-xs">{cat.icon}</span>
                <span className="text-[10px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                <span className="text-xs font-black" style={{ color: cat.color }}>{cat.count}</span>
              </div>
            ))}
            {searchQuery && filtered.length < creFiltered.length && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Search size={10} style={{ color: '#2563EB' }} />
                <span className="text-[10px] font-bold" style={{ color: '#2563EB' }}>
                  {filtered.length} of {creFiltered.length}
                </span>
              </div>
            )}
          </div>

          {/* Call list */}
          <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: '#F0EBE0' }}>
            {filtered.map(act => {
              const lead = leadMap[act.lead_id]
              const badge = getBadge(act.description)
              const leadName = (act as any).lead_name_override || lead?.lead_name || histLeadMap[act.lead_id] || 'Unknown'
              const phone = lead?.phone || histPhoneMap[act.lead_id] || ''

              return (
                <Link key={act.id} href={`${leadBase}/${act.lead_id}`}>
                  <div className="px-3 py-2.5 flex items-center gap-2.5 hover:bg-green-50/60 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#16A34A,#047857)' }}>
                      {ini(leadName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: '#1C1712' }}>{leadName}</p>
                      {phone && (
                        <p className="text-[9px] font-semibold flex items-center gap-1 mt-0.5" style={{ color: '#6B7280' }}>
                          <Phone size={8} /> {phone}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.icon} {act.description?.replace('Called — ', '').split(' for ')[0].split(' ₹')[0] || 'Call'}
                        </span>
                      </div>
                      <p className="text-[9px] mt-0.5 font-medium" style={{ color: '#B8B0A0' }}>
                        {new Date(act.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' · '}
                        {new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        {act.user_name ? ` · ${act.user_name}` : ''}
                      </p>
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