import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Phone, Calendar, MapPin, FileText, Trophy, XCircle, TrendingUp } from 'lucide-react'

// ✅ FIX 1: force-dynamic so Today's calls always fresh
export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'new',       label: 'New Leads',     icon: UserPlus, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', href: '/dashboard/industries/interior-design/new-leads',  description: 'Fresh enquiries' },
  { key: 'followup',  label: 'Follow Up',     icon: Calendar, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', href: '/dashboard/industries/interior-design/follow-up',   description: 'Date confirmed' },
  { key: 'rnr',       label: 'RNR',           icon: Phone,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/rnr',          description: 'Ring No Response' },
  { key: 'sitevisit', label: 'Site Visit',    icon: MapPin,   color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', href: '/dashboard/industries/interior-design/site-visit',   description: 'Visit scheduled' },
  { key: 'quotation', label: 'Quotations',    icon: FileText, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', href: '/dashboard/industries/interior-design/quotations',   description: 'Quotation sent' },
  { key: 'won',       label: 'Won',           icon: Trophy,   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', href: '/dashboard/industries/interior-design/won',          description: 'Deal closed 🎉' },
  { key: 'lost',      label: 'Lost',          icon: XCircle,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/lost',         description: 'Not interested' },
]

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase() || '?'
const GRADIENTS = [['#7C3AED','#4F46E5'],['#0891B2','#0E7490'],['#059669','#047857'],['#D97706','#B45309'],['#DB2777','#BE185D']]

export default async function InteriorDesignDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

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
  const totalBudget = allLeads?.reduce((s, l: any) => {
    const b = parseFloat(String(l.budget || '0').replace(/[^0-9.]/g, ''))
    return s + (isNaN(b) ? 0 : b)
  }, 0) ?? 0

  const todayStr   = new Date().toDateString()
  const todayLeads = allLeads?.filter(l => new Date(l.created_at).toDateString() === todayStr).length ?? 0
  const convRate   = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'

  const leadIds = allLeads?.map((l: any) => l.id) ?? []
  const leadMap: Record<string, any> = {}
  allLeads?.forEach((l: any) => { leadMap[l.id] = l })

  // ✅ FIX 2: Use IST timezone for today/yesterday boundaries
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffset)
  const istDateStr = istNow.toISOString().split('T')[0]

  const todayStart = new Date(`${istDateStr}T00:00:00+05:30`)
  const todayEnd   = new Date(`${istDateStr}T23:59:59+05:30`)
  const yestStart  = new Date(todayStart.getTime() - 24*60*60*1000)
  const yestEnd    = new Date(todayStart.getTime() - 1)

  let todayCalls: any[] = []
  let yesterdayCalls: any[] = []
  let crmTeam: any[] = []

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin'

  if (leadIds.length > 0) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data: allProfiles } = await admin.from('profiles').select('id, full_name, email')
      const profileMap: Record<string, string> = {}
      allProfiles?.forEach((p: any) => { profileMap[p.id] = p.full_name || p.email || 'Unknown' })

      // ✅ FIX 3: Fetch calls with IST-correct timestamps
      let todayQ = admin.from('lead_activities')
        .select('id, lead_id, title, description, created_at, user_id')
        .in('lead_id', leadIds).eq('type', 'call')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .order('created_at', { ascending: false })
      if (!isAdmin) todayQ = todayQ.eq('user_id', user.id)
      const { data: todayActs } = await todayQ
      todayCalls = (todayActs ?? []).map((a: any) => ({ ...a, user_name: a.user_id ? (profileMap[a.user_id] || 'Unknown') : null }))

      let yestQ = admin.from('lead_activities')
        .select('id, lead_id, title, description, created_at, user_id')
        .in('lead_id', leadIds).eq('type', 'call')
        .gte('created_at', yestStart.toISOString())
        .lte('created_at', yestEnd.toISOString())
        .order('created_at', { ascending: false })
      if (!isAdmin) yestQ = yestQ.eq('user_id', user.id)
      const { data: yestActs } = await yestQ
      yesterdayCalls = (yestActs ?? []).map((a: any) => ({ ...a, user_name: a.user_id ? (profileMap[a.user_id] || 'Unknown') : null }))

      // CRM Team
      const { data: employees } = await admin.from('profiles')
        .select('id, full_name, email, role').eq('company_id', profile.company_id)
        .in('role', ['employee', 'tenant_admin', 'admin'])

      if (employees) {
        const { data: allCallActs } = await admin.from('lead_activities')
          .select('id, lead_id, user_id, created_at, title, description')
          .in('lead_id', leadIds).eq('type', 'call')
          .gte('created_at', yestStart.toISOString())
          .order('created_at', { ascending: false })

        const allCalls = allCallActs ?? []
        crmTeam = employees.map((emp: any) => {
          const empCalls = allCalls.filter((a: any) => a.user_id === emp.id)
          const todayCallsEmp = empCalls.filter((a: any) => new Date(a.created_at) >= todayStart)
          const yestCallsEmp  = empCalls.filter((a: any) => new Date(a.created_at) < todayStart)
          const lastCall = empCalls[0]
          return {
            id: emp.id, name: emp.full_name || emp.email || 'Unknown', email: emp.email,
            todayCount: todayCallsEmp.length, yestCount: yestCallsEmp.length,
            totalCalls: empCalls.length,
            lastCallTime: lastCall?.created_at ?? null,
            lastCallLead: lastCall ? leadMap[lastCall.lead_id]?.lead_name ?? null : null,
            lastCallId: lastCall?.lead_id ?? null,
          }
        }).sort((a: any, b: any) => b.todayCount - a.todayCount)
      }
    } catch {}
  }

  const LEAD_BASE = '/dashboard/industries/interior-design/leads'

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(184,134,11,0.12); }
        .row-hover:hover { background: #FDFAF6; }
        .row-hover { transition: background 0.15s ease; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-6">

        {/* ── HEADER ── */}
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
          <p className="text-sm mt-0.5" style={{ color:'#9A8F82' }}>Live overview · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
        </div>

        {/* ── TOP STATS ── */}
        <div className="grid grid-cols-2 gap-3 fade-up">
          {[
            { label:'Total Leads',  value:totalLeads,  color:'#7C3AED', icon:'👥', bg:'#F5F3FF' },
            { label:'Active',       value:activeLeads, color:'#0891B2', icon:'⚡', bg:'#ECFEFF' },
            { label:'Won',          value:wonLeads,    color:'#059669', icon:'🏆', bg:'#ECFDF5' },
            { label:'Today New',    value:todayLeads,  color:'#B8860B', icon:'📅', bg:'#FFFBEB' },
          ].map((s,i) => (
            <div key={i} className="card-hover rounded-2xl p-4" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:s.bg }}>
                  {s.icon}
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-right" style={{ color:'#9A8F82' }}>{s.label}</p>
              </div>
              <p className="text-3xl font-black" style={{ color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── CONVERSION + BUDGET ── */}
        <div className="grid grid-cols-2 gap-3 fade-up">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)',border:'1px solid #FDE68A',boxShadow:'0 2px 8px rgba(184,134,11,0.08)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(184,134,11,0.15)' }}>
              <TrendingUp className="w-5 h-5" style={{ color:'#B8860B' }}/>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#92400E' }}>Conversion</p>
              <p className="text-xl font-black" style={{ color:'#B8860B' }}>{convRate}%</p>
              <p className="text-[9px]" style={{ color:'#B45309' }}>{wonLeads} won / {totalLeads}</p>
            </div>
          </div>
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'1px solid #A7F3D0',boxShadow:'0 2px 8px rgba(5,150,105,0.08)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background:'rgba(5,150,105,0.15)' }}>💰</div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'#065F46' }}>Pipeline</p>
              <p className="text-xl font-black" style={{ color:'#059669' }}>
                {totalBudget >= 100000 ? '₹'+(totalBudget/100000).toFixed(1)+'L' : '₹'+totalBudget.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px]" style={{ color:'#047857' }}>combined budget</p>
            </div>
          </div>
        </div>

        {/* ── TODAY'S CALLS ── */}
        <div className="fade-up rounded-2xl overflow-hidden" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',borderBottom:'1px solid #A7F3D0' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(22,163,74,0.2)' }}>
                <span className="text-base">📞</span>
              </div>
              <div>
                <p className="text-sm font-black" style={{ color:'#14532D' }}>Today's Calls</p>
                <p className="text-[9px]" style={{ color:'#16A34A' }}>{istDateStr} · IST</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white"
              style={{ background:'linear-gradient(135deg,#16A34A,#047857)',boxShadow:'0 3px 10px rgba(22,163,74,0.35)' }}>
              {todayCalls.length}
            </div>
          </div>

          {todayCalls.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background:'#F0FDF4' }}>📵</div>
              <p className="text-sm font-bold" style={{ color:'#374151' }}>No calls logged today</p>
              <p className="text-[11px] mt-1" style={{ color:'#9A8F82' }}>Start calling your leads!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor:'#F0EBE0' }}>
              {todayCalls.map((act: any) => {
                const lead = leadMap[act.lead_id]
                return (
                  <Link key={act.id} href={`${LEAD_BASE}/${act.lead_id}`}>
                    <div className="row-hover px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background:'linear-gradient(135deg,#16A34A,#047857)' }}>
                        {ini(lead?.lead_name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color:'#1C1712' }}>{lead?.lead_name ?? 'Unknown'}</p>
                        {act.description && <p className="text-[10px] truncate mt-0.5" style={{ color:'#7A6E60' }}>{act.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px]" style={{ color:'#9A8F82' }}>
                            {new Date(act.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                          </span>
                          {act.user_name && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:'#F0FDF4',color:'#16A34A' }}>👤 {act.user_name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background:'#F0FDF4',color:'#16A34A' }}>📞</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── YESTERDAY'S CALLS ── */}
        <div className="fade-up rounded-2xl overflow-hidden" style={{ background:'#fff',border:'1px solid #E8E2D8',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)',borderBottom:'1px solid #FDE68A' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(217,119,6,0.15)' }}>
                <span className="text-base">📋</span>
              </div>
              <div>
                <p className="text-sm font-black" style={{ color:'#78350F' }}>Yesterday's Calls</p>
                <p className="text-[9px]" style={{ color:'#D97706' }}>{new Date(yestStart).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white"
              style={{ background:'linear-gradient(135deg,#D97706,#B45309)',boxShadow:'0 3px 10px rgba(217,119,6,0.35)' }}>
              {yesterdayCalls.length}
            </div>
          </div>

          {yesterdayCalls.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background:'#FFFBEB' }}>📭</div>
              <p className="text-sm font-bold" style={{ color:'#374151' }}>No calls logged yesterday</p>
              <p className="text-[11px] mt-1" style={{ color:'#9A8F82' }}>Keep track of your daily calls</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor:'#F0EBE0' }}>
              {yesterdayCalls.map((act: any) => {
                const lead = leadMap[act.lead_id]
                return (
                  <Link key={act.id} href={`${LEAD_BASE}/${act.lead_id}`}>
                    <div className="row-hover px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background:'linear-gradient(135deg,#D97706,#B45309)' }}>
                        {ini(lead?.lead_name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color:'#1C1712' }}>{lead?.lead_name ?? 'Unknown'}</p>
                        {act.description && <p className="text-[10px] truncate mt-0.5" style={{ color:'#7A6E60' }}>{act.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px]" style={{ color:'#9A8F82' }}>
                            {new Date(act.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                          </span>
                          {act.user_name && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:'#FFFBEB',color:'#D97706' }}>👤 {act.user_name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background:'#FFFBEB',color:'#D97706' }}>📋</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── STAGE WISE CARDS ── */}
        <div className="fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color:'#B8860B' }}>Stage Wise Count</p>
          <div className="grid grid-cols-2 gap-3">

            {/* All Leads */}
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
                      <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`,background:stage.color,minWidth:count>0?'8px':'0' }}/>
                    </div>
                    <p className="text-[9px] mt-1" style={{ color:'#C4BAB0' }}>{pct}% of total</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── TOTAL LEADS BREAKDOWN ── */}
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
                          <span className="text-sm font-black w-6 text-right" style={{ color:stage.color }}>{count}</span>
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



        <p className="text-center text-[10px] pb-2" style={{ color:'#C4BAB0' }}>
          Interior Design Pipeline · GK CRM · Live data
        </p>
      </div>
    </div>
  )
}