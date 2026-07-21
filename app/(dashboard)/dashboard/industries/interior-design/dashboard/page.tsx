import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Phone, Calendar, MapPin, FileText, Trophy, XCircle, Lock } from 'lucide-react'
import { TodayCallsSection } from '@/components/interior/today-calls-section'
import { fetchAllLeads } from '@/lib/fetch-all-leads'
import { subscriptionService } from '@/modules/subscription/service'

export const dynamic = 'force-dynamic'

interface Lead {
  id: string
  pipeline_stage?: string | null
  budget?: string | number | null
  created_at: string
  lead_name?: string | null
  phone?: string | null
  notes?: string | null
  [key: string]: unknown
}

interface Activity {
  id: string
  lead_id: string
  title?: string | null
  description?: string | null
  created_at: string
  user_id?: string | null
  user_name?: string | null
  [key: string]: unknown
}

interface ProfileRow {
  id: string
  full_name?: string | null
  email?: string | null
  role?: string | null
}

interface Cre {
  id: string
  name: string
}

const STAGES = [
  { key: 'new',       label: 'New Leads',  icon: UserPlus, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', href: '/dashboard/industries/interior-design/new-leads',  description: 'Fresh enquiries' },
  { key: 'followup',  label: 'Follow Up',  icon: Calendar, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', href: '/dashboard/industries/interior-design/follow-up',   description: 'Date confirmed' },
  { key: 'rnr',       label: 'RNR',        icon: Phone,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/rnr',          description: 'Ring No Response' },
  { key: 'sitevisit', label: 'Site Visit', icon: MapPin,   color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', href: '/dashboard/industries/interior-design/site-visit',   description: 'Visit scheduled' },
  { key: 'quotation', label: 'Quotations', icon: FileText, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', href: '/dashboard/industries/interior-design/quotations',   description: 'Quotation sent' },
  { key: 'won',       label: 'Won',        icon: Trophy,   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', href: '/dashboard/industries/interior-design/won',          description: 'Deal closed 🎉' },
  { key: 'lost',      label: 'Lost',       icon: XCircle,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/lost',         description: 'Not interested' },
]

export default async function InteriorDesignDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id, role, full_name, email').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // Only admins/owners can see the whole team's performance; regular CRE staff see only their own.
  const isAdminOrOwner = profile.role === 'admin' || profile.role === 'owner' || profile.role === 'tenant_admin' || profile.role === 'manager'

  // ── Plan-based dashboard tier ─────────────────────────────────────
  // Starter: basic stat cards + stage-wise pipeline only.
  // Professional/Business: same, plus an embedded analytics snapshot
  // and a working "Analytics" deep-link (uses the 'realtime' feature flag,
  // same one that unlocks the real-time dashboard on the pricing page).
  const hasAdvancedAnalytics = await subscriptionService.hasFeature(profile.company_id, 'realtime')

  // ── Leads data — shared helper, bypasses Supabase 1000-row cap ──
  const allLeads = await fetchAllLeads<Lead>(
    supabase,
    profile.company_id,
    'interior-design',
    'id, pipeline_stage, budget, created_at, lead_name, phone, notes'
  )

  const stageCounts: Record<string, number> = {}
  STAGES.forEach(s => { stageCounts[s.key] = 0 })
  allLeads?.forEach((l: Lead) => {
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
  const lostLeads   = stageCounts['lost'] ?? 0
  const activeLeads = totalLeads - wonLeads - lostLeads
  const todayStr    = new Date().toDateString()
  const todayLeads  = allLeads?.filter(l => new Date(l.created_at).toDateString() === todayStr).length ?? 0
  const winRate     = (wonLeads + lostLeads) > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) : 0

  // ── Simple 30-day trend (for the Professional+ snapshot chart) ──
  const trendDays: { label: string; count: number }[] = []
  if (hasAdvancedAnalytics && allLeads) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toDateString()
      const count = allLeads.filter(l => new Date(l.created_at).toDateString() === dayStr).length
      trendDays.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), count })
    }
  }
  const trendMax = Math.max(1, ...trendDays.map(d => d.count))

  const leadIds = allLeads?.map((l: Lead) => l.id) ?? []

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  // eslint-disable-next-line react-hooks/purity -- server component — computed per request, not a client render purity concern
  const nowUTC    = Date.now()
  const istDateStr = new Date(nowUTC + IST_OFFSET_MS).toISOString().split('T')[0]
  const todayStart = new Date(`${istDateStr}T00:00:00+05:30`)
  const todayEnd   = new Date(`${istDateStr}T23:59:59+05:30`)

  let todayCalls: Activity[] = []

  if (leadIds.length > 0) {
    try {
      const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

      // ⚠️ FIXED: company_id + industry filter now applied in the DB query itself via an
      // embedded join on `leads`. Previously this query had NO company filter — it pulled the
      // most-recent 500 'call' activities across ALL tenants, then filtered by leadIdSet in JS.
      // On a busy day, other companies' calls could push this company's earlier calls out of
      // that global top-500 window, silently undercounting today's calls.
      const url = `${SURL}/rest/v1/lead_activities?select=id,lead_id,title,description,created_at,user_id,leads!inner(company_id,industry)&type=eq.call&leads.company_id=eq.${profile.company_id}&leads.industry=eq.interior-design&created_at=gte.${encodeURIComponent(todayStart.toISOString())}&created_at=lte.${encodeURIComponent(todayEnd.toISOString())}&order=created_at.desc&limit=1000`

      const res = await fetch(url, {
        headers: { 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}` },
        cache: 'no-store',
      })

      if (res.ok) {
        const todayActs: Activity[] = await res.json()

        if (todayActs.length > 0) {
          const uids = [...new Set(todayActs.map((a: Activity) => a.user_id).filter(Boolean))] as string[]
          const pm: Record<string, string> = {}
          if (uids.length > 0) {
            const profUrl = `${SURL}/rest/v1/profiles?id=in.(${uids.join(',')})&select=id,full_name,email`
            const profRes = await fetch(profUrl, {
              headers: { 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}` },
              cache: 'no-store',
            })
            if (profRes.ok) {
              const profs: ProfileRow[] = await profRes.json()
              profs?.forEach((p: ProfileRow) => { pm[p.id] = p.full_name || p.email || 'Unknown' })
            }
          }
          todayCalls = todayActs.map((a: Activity) => ({
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

  // ⚠️ ACCESS CONTROL: non-admin CRE staff must only ever see their own calls/performance,
  // never teammates'. Filter here (not just hide in the UI) so the data never even reaches
  // the client for a restricted user.
  const visibleTodayCalls = isAdminOrOwner ? todayCalls : todayCalls.filter(a => a.user_id === user.id)

  // ⚠️ FIXED (again): the CRE list must only include staff whose employee record has
  // designation = 'CRE' (e.g. "Hari Krishna CRE", "Thamalapakula Anusha") — not every profile
  // in the company. The earlier fix pulled ALL company profiles, which wrongly included the
  // MD, Web Developer, Digital Marketing, and Tele-calling roles alongside the actual CREs.
  let cres: Cre[] = []
  if (isAdminOrOwner) {
    const { data: creEmployees } = await supabase
      .from('employees')
      .select('user_id, full_name, designation')
      .eq('company_id', profile.company_id)
      .ilike('designation', 'CRE')

    cres = (creEmployees ?? [])
      .filter((e: { user_id?: string | null }) => !!e.user_id)
      .map((e: { user_id?: string | null; full_name?: string | null }) => ({ id: e.user_id as string, name: e.full_name || 'Unknown' }))
      .sort((a: Cre, b: Cre) => a.name.localeCompare(b.name))
  } else {
    // Regular CRE staff: the only "team member" they can ever see is themselves.
    cres = [{ id: user.id, name: profile.full_name || profile.email || 'Me' }]
  }

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .card-hover { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(184,134,11,0.14); }
      `}</style>

      <div className="px-2 md:px-4 pt-3 pb-10 space-y-4 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="fade-up">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color:'#B8860B' }}>Interior Design CRM</p>
            {/* Analytics + CRE dashboard both show company-wide data — admin/owner only */}
            {isAdminOrOwner && (
            <div className="flex items-center gap-2">
              {hasAdvancedAnalytics ? (
                <Link href="/dashboard/industries/interior-design/analytics"
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white transition-all hover:-translate-y-0.5"
                  style={{ background:'linear-gradient(135deg,#B8860B,#D97706)',boxShadow:'0 4px 14px rgba(184,134,11,0.32)' }}>
                  📊 Analytics
                </Link>
              ) : (
                <Link href="/dashboard/settings/company"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all hover:-translate-y-0.5"
                  style={{ background:'#F0EBE0', color:'#9A8F82', border:'1px dashed #D5CFC3' }}>
                  <Lock size={11} /> Analytics
                </Link>
              )}
              <Link href="/dashboard/industries/interior-design/cre"
                className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white transition-all hover:-translate-y-0.5"
                style={{ background:'linear-gradient(135deg,#1C1712,#2d2218)',border:'1px solid rgba(184,134,11,0.3)', boxShadow:'0 4px 14px rgba(28,23,18,0.25)' }}>
                📋 CRE
              </Link>
            </div>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color:'#1C1712' }}>Pipeline Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color:'#9A8F82' }}>
            Live overview · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </p>
        </div>

        {/* TOP STATS — every plan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-up">
          {[
            { label:'Total Leads', value:totalLeads,  color:'#7C3AED', icon:'👥', bg:'#F5F3FF' },
            { label:'Active',      value:activeLeads, color:'#0891B2', icon:'⚡', bg:'#ECFEFF' },
            { label:'Won',         value:wonLeads,    color:'#059669', icon:'🏆', bg:'#ECFDF5' },
            { label:'Today New',   value:todayLeads,  color:'#B8860B', icon:'📅', bg:'#FFFBEB' },
          ].map((s,i) => (
            <div key={i} className="card-hover relative overflow-hidden rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #EDE7DB',boxShadow:'0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-[0.05]" style={{ background:s.color }} />
              <div className="relative flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:s.bg }}>{s.icon}</div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-right" style={{ color:'#9A8F82' }}>{s.label}</p>
              </div>
              <p className="relative text-3xl font-black tracking-tight" style={{ color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* STAGE WISE CARDS — every plan */}
        <div className="fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color:'#B8860B' }}>Stage Wise Count</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/industries/interior-design/all-leads">
              <div className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #EDE7DB',boxShadow:'0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:'#F5F0E8',border:'1px solid #E2D9C8' }}>👥</div>
                  <p className="text-2xl font-black" style={{ color:'#1C1712' }}>{totalLeads}</p>
                </div>
                <p className="text-sm font-bold" style={{ color:'#1C1712' }}>All Leads</p>
                <p className="text-[10px] mt-0.5" style={{ color:'#9A8F82' }}>All stages combined</p>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background:'#F0EBE0' }}>
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
                  <div className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #EDE7DB',boxShadow:'0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:stage.bg,border:`1px solid ${stage.border}` }}>
                        <Icon className="w-5 h-5" style={{ color:stage.color }}/>
                      </div>
                      <p className="text-2xl font-black" style={{ color:stage.color }}>{count}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color:'#1C1712' }}>{stage.label}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color:'#9A8F82' }}>{stage.description}</p>
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background:'#F0EBE0' }}>
                      <div className="h-1.5 rounded-full" style={{ width:`${pct}%`,background:stage.color,minWidth:count>0?'8px':'0' }}/>
                    </div>
                    <p className="text-[9px] mt-1" style={{ color:'#C4BAB0' }}>{pct}% of total</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ADVANCED ANALYTICS SNAPSHOT — Professional & Business only */}
        {hasAdvancedAnalytics ? (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color:'#B8860B' }}>Advanced Analytics</p>
              <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background:'#FFFBEB', color:'#B8860B', border:'1px solid #FDE68A' }}>Professional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Win rate card */}
              <div className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #EDE7DB',boxShadow:'0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:'#9A8F82' }}>Win Rate</p>
                <p className="text-3xl font-black" style={{ color:'#059669' }}>{winRate}%</p>
                <p className="text-[10px] mt-1" style={{ color:'#9A8F82' }}>{wonLeads} won · {lostLeads} lost</p>
              </div>

              {/* 7-day lead trend */}
              <div className="md:col-span-2 card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #EDE7DB',boxShadow:'0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color:'#9A8F82' }}>New Leads — Last 7 Days</p>
                <div className="flex items-end justify-between gap-2" style={{ height: 72 }}>
                  {trendDays.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-md" style={{
                        height: `${Math.max(6, (d.count / trendMax) * 56)}px`,
                        background: 'linear-gradient(180deg,#D97706,#B8860B)',
                      }} title={`${d.count} leads`} />
                      <p className="text-[8px] font-bold" style={{ color:'#9A8F82' }}>{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <Link href="/dashboard/settings/company"
              className="flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ background:'#FFFBEB', border:'1px dashed #FCD34D' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#FFF3D6' }}>
                <Lock size={16} style={{ color:'#B45309' }} />
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color:'#B45309' }}>Advanced analytics available on Professional</p>
                <p className="text-[11px]" style={{ color:'#9A8F82' }}>Win rate, lead trends & real-time dashboard — upgrade to unlock.</p>
              </div>
            </Link>
          </div>
        )}

        {/* TEAM PERFORMANCE */}
        <div className="fade-up">
          <TodayCallsSection
            todayCalls={visibleTodayCalls}
            cres={cres}
            istDateStr={istDateStr}
            companyId={profile.company_id}
            isAdminOrOwner={isAdminOrOwner}
            currentUserId={user.id}
          />
        </div>

        <p className="text-center text-[10px] pb-2" style={{ color:'#C4BAB0' }}>
          Interior Design Pipeline · GK CRM · Live data
        </p>
      </div>
    </div>
  )
}