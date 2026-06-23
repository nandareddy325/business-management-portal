import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Phone, Calendar, MapPin, FileText, Trophy, XCircle } from 'lucide-react'
import { TodayCallsSection } from '@/components/interior/today-calls-section'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'new',       label: 'New Leads',  icon: UserPlus, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', href: '/dashboard/industries/interior-design/new-leads',  description: 'Fresh enquiries' },
  { key: 'followup',  label: 'Follow Up',  icon: Calendar, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', href: '/dashboard/industries/interior-design/follow-up',   description: 'Date confirmed' },
  { key: 'rnr',       label: 'RNR',        icon: Phone,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/rnr',          description: 'Ring No Response' },
  { key: 'sitevisit', label: 'Site Visit', icon: MapPin,   color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', href: '/dashboard/industries/interior-design/site-visit',   description: 'Visit scheduled' },
  { key: 'quotation', label: 'Quotations', icon: FileText, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', href: '/dashboard/industries/interior-design/quotations',   description: 'Quotation sent' },
  { key: 'won',       label: 'Won',        icon: Trophy,   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', href: '/dashboard/industries/interior-design/won',          description: 'Deal closed 🎉' },
  { key: 'lost',      label: 'Lost',       icon: XCircle,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/lost',         description: 'Not interested' },
]

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase() || '?'

export default async function InteriorDesignDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // ── Leads data ──
  const { data: allLeads } = await supabase
    .from('leads').select('id, pipeline_stage, budget, created_at, lead_name, phone, notes')
    .eq('company_id', profile.company_id).eq('industry', 'interior-design')

  const stageCounts: Record<string, number> = {}
  STAGES.forEach(s => { stageCounts[s.key] = 0 })
  allLeads?.forEach((l: any) => {
    const s = l.pipeline_stage
    if (!s) return
    if (s === 'followup' && String(l.notes || '').startsWith('[RNR]')) {
      stageCounts['rnr'] = (stageCounts['rnr'] || 0) + 1
    } else if (stageCounts[s] !== undefined) {
      stageCounts[s]++
    }
  })

  const totalLeads  = allLeads?.length ?? 0
  const wonLeads    = stageCounts['won'] ?? 0
  const activeLeads = totalLeads - wonLeads - (stageCounts['lost'] ?? 0)
  const todayStr   = new Date().toDateString()
  const todayLeads = allLeads?.filter(l => new Date(l.created_at).toDateString() === todayStr).length ?? 0

  const leadIds = allLeads?.map((l: any) => l.id) ?? []
  const leadMap: Record<string, any> = {}
  allLeads?.forEach((l: any) => { leadMap[l.id] = l })

  // ── IST timezone boundaries ──
  // IST = UTC+5:30, so IST midnight = UTC 18:30 previous day
  // e.g. 2026-06-22 00:00 IST = 2026-06-21 18:30:00 UTC
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const nowUTC = Date.now()
  const istDateStr = new Date(nowUTC + IST_OFFSET_MS).toISOString().split('T')[0] // "2026-06-22"
  // IST midnight in UTC = parse YYYY-MM-DD as IST midnight
  const todayStart = new Date(`${istDateStr}T00:00:00+05:30`) // → UTC 18:30 prev day
  const todayEnd   = new Date(`${istDateStr}T23:59:59+05:30`) // → UTC 18:29:59 same day

  // ── Calls — use same supabase client (RLS bypassed with service role via admin) ──
  let todayCalls: any[] = []

  // Fetch today calls — date only filter, then JS filter by leadIds
  if (leadIds.length > 0) {
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

      // Only filter by date + type — no leadIds in URL (avoids header overflow)
      const url = `${SURL}/rest/v1/lead_activities?select=id,lead_id,title,description,created_at,user_id&type=eq.call&created_at=gte.${encodeURIComponent(todayStart.toISOString())}&created_at=lte.${encodeURIComponent(todayEnd.toISOString())}&order=created_at.desc&limit=500`

      const res = await fetch(url, {
        headers: {
          'apikey': SKEY,
          'Authorization': `Bearer ${SKEY}`,
        },
        cache: 'no-store',
      })

      if (res.ok) {
        const allActs = await res.json()
        // Filter by this company's leadIds in JS
        const leadIdSet = new Set(leadIds)
        const todayActs = (allActs ?? []).filter((a: any) => leadIdSet.has(a.lead_id))
        console.log('[Calls] REST fetched:', allActs?.length, '| company filtered:', todayActs.length)

        if (todayActs.length > 0) {
          const uids = [...new Set(todayActs.map((a: any) => a.user_id).filter(Boolean))]
          const pm: Record<string, string> = {}
          if (uids.length > 0) {
            const profUrl = `${SURL}/rest/v1/profiles?id=in.(${uids.join(',')})&select=id,full_name,email`
            const profRes = await fetch(profUrl, {
              headers: { 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}` },
              cache: 'no-store',
            })
            if (profRes.ok) {
              const profs = await profRes.json()
              profs?.forEach((p: any) => { pm[p.id] = p.full_name || p.email || 'Unknown' })
            }
          }
          todayCalls = todayActs.map((a: any) => ({
            ...a, user_name: a.user_id ? (pm[a.user_id] || 'Unknown') : null
          }))
        }
      } else {
        console.error('[Calls] REST error:', res.status, await res.text())
      }
    } catch (e) {
      console.error('[Calls] error:', e)
    }
  }

  // Fetch CRE list for dropdown
  const creIds = [...new Set(todayCalls.map((a: any) => a.user_id).filter(Boolean))]
  let cres: { id: string; name: string }[] = []
  if (creIds.length > 0) {
    const { data: creProfiles } = await supabase.from('profiles').select('id, full_name, email').in('id', creIds)
    cres = (creProfiles ?? []).map((p: any) => ({ id: p.id, name: p.full_name || p.email || 'Unknown' }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }

  const LEAD_BASE = '/dashboard/industries/interior-design/leads'

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(184,134,11,0.12); }
        .row-hover { transition: background 0.15s ease; }
        .row-hover:hover { background: #FDFAF6; }
      `}</style>

      <div className="px-4 md:px-6 pt-5 pb-10 space-y-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="fade-up">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color:'#B8860B' }}>Interior Design CRM</p>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/industries/interior-design/analytics"
                className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
                style={{ background:'linear-gradient(135deg,#B8860B,#D97706)',boxShadow:'0 3px 10px rgba(184,134,11,0.3)' }}>
                📊 Analytics
              </Link>
              <Link href="/dashboard/industries/interior-design/cre"
                className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
                style={{ background:'linear-gradient(135deg,#1C1712,#2d2218)',border:'1px solid rgba(184,134,11,0.3)' }}>
                📋 CRE
              </Link>
            </div>
          </div>
          <h1 className="text-2xl font-black" style={{ color:'#1C1712' }}>Pipeline Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color:'#9A8F82' }}>
            Live overview · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </p>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-up">
          {[
            { label:'Total Leads', value:totalLeads,  color:'#7C3AED', icon:'👥', bg:'#F5F3FF' },
            { label:'Active',      value:activeLeads, color:'#0891B2', icon:'⚡', bg:'#ECFEFF' },
            { label:'Won',         value:wonLeads,    color:'#059669', icon:'🏆', bg:'#ECFDF5' },
            { label:'Today New',   value:todayLeads,  color:'#B8860B', icon:'📅', bg:'#FFFBEB' },
          ].map((s,i) => (
            <div key={i} className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:s.bg }}>{s.icon}</div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-right" style={{ color:'#9A8F82' }}>{s.label}</p>
              </div>
              <p className="text-3xl font-black" style={{ color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>



        {/* STAGE WISE CARDS */}
        <div className="fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color:'#B8860B' }}>Stage Wise Count</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/industries/interior-design/all-leads">
              <div className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:'#F5F0E8',border:'1px solid #E2D9C8' }}>👥</div>
                  <p className="text-2xl font-black" style={{ color:'#1C1712' }}>{totalLeads}</p>
                </div>
                <p className="text-sm font-bold" style={{ color:'#1C1712' }}>All Leads</p>
                <p className="text-[10px] mt-0.5" style={{ color:'#9A8F82' }}>All stages combined</p>
                <div className="mt-3 h-1.5 rounded-full" style={{ background:'#F0EBE0' }}>
                  <div className="h-1.5 rounded-full w-full" style={{ background:'#1C1712' }}/>
                </div>
                <p className="text-[9px] mt-1" style={{ color:'#C4BAB0' }}>100% of total</p>
              </div>
            </Link>
            {STAGES.map((stage) => {
              const Icon = stage.icon
              const count = stageCounts[stage.key] ?? 0
              const pct = totalLeads > 0 ? Math.round((count/totalLeads)*100) : 0
              return (
                <Link key={stage.key} href={stage.href}>
                  <div className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:stage.bg,border:`1px solid ${stage.border}` }}>
                        <Icon className="w-5 h-5" style={{ color:stage.color }}/>
                      </div>
                      <p className="text-2xl font-black" style={{ color:stage.color }}>{count}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color:'#1C1712' }}>{stage.label}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color:'#9A8F82' }}>{stage.description}</p>
                    <div className="mt-3 h-1.5 rounded-full" style={{ background:'#F0EBE0' }}>
                      <div className="h-1.5 rounded-full" style={{ width:`${pct}%`,background:stage.color,minWidth:count>0?'8px':'0' }}/>
                    </div>
                    <p className="text-[9px] mt-1" style={{ color:'#C4BAB0' }}>{pct}% of total</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* LEADS BREAKDOWN */}
        <div className="fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color:'#B8860B' }}>Leads Breakdown</p>
          <div className="rounded-2xl overflow-hidden" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            {STAGES.map((stage, i) => {
              const Icon = stage.icon
              const count = stageCounts[stage.key] ?? 0
              const pct = totalLeads > 0 ? Math.round((count/totalLeads)*100) : 0
              return (
                <Link key={stage.key} href={stage.href}>
                  <div className="row-hover flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < STAGES.length-1 ? '1px solid #F0EBE0' : 'none' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:stage.bg,border:`1px solid ${stage.border}` }}>
                      <Icon className="w-4 h-4" style={{ color:stage.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-bold" style={{ color:'#1C1712' }}>{stage.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color:'#9A8F82' }}>{pct}%</span>
                          <span className="text-sm font-black w-8 text-right" style={{ color:stage.color }}>{count}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background:'#F0EBE0' }}>
                        <div className="h-1.5 rounded-full" style={{ width:`${pct}%`,background:stage.color,minWidth:count>0?'6px':'0',transition:'width 0.6s ease' }}/>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            <div className="px-4 py-3 flex items-center justify-between" style={{ background:'#FAFAF8',borderTop:'1px solid #F0EBE0' }}>
              <p className="text-[10px]" style={{ color:'#9A8F82' }}>Total across all stages</p>
              <p className="text-sm font-black" style={{ color:'#1C1712' }}>{totalLeads} leads</p>
            </div>
          </div>
        </div>

        {/* TODAY CALLS */}
        <div className="fade-up">
          <TodayCallsSection
          todayCalls={todayCalls}
          leadMap={leadMap}
          cres={cres}
          istDateStr={istDateStr}
          leadBase={LEAD_BASE}
          companyId={profile.company_id}
          />
        </div>

        <p className="text-center text-[10px] pb-2" style={{ color:'#C4BAB0' }}>
          Interior Design Pipeline · GK CRM · Live data
        </p>
      </div>
    </div>
  )
}