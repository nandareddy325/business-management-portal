import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus, Phone, Calendar,
  MapPin, FileText, Trophy, XCircle, TrendingUp
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'new',       label: 'New Leads',  icon: UserPlus, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', href: '/dashboard/industries/interior-design/new-leads',  description: 'Fresh enquiries just came in' },
  { key: 'followup',  label: 'Follow Up',  icon: Calendar, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', href: '/dashboard/industries/interior-design/follow-up', description: 'Interested — date confirmed' },
  { key: 'rnr',       label: 'RNR',        icon: Phone,    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/rnr',        description: 'Ring No Response' },
  { key: 'sitevisit', label: 'Site Visit', icon: MapPin,   color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', href: '/dashboard/industries/interior-design/site-visit', description: 'Site visit scheduled / done' },
  { key: 'quotation', label: 'Quotations', icon: FileText, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', href: '/dashboard/industries/interior-design/quotations', description: 'Quotation sent to client' },
  { key: 'won',       label: 'Won / Closing', icon: Trophy, color: '#B8860B', bg: '#FFFBEB', border: '#FDE68A', href: '/dashboard/industries/interior-design/won',       description: 'Deal closed! 🎉' },
  { key: 'lost',      label: 'Lost',       icon: XCircle,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', href: '/dashboard/industries/interior-design/lost',       description: 'Not interested / dropped' },
]

export default async function InteriorDesignDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, pipeline_stage, budget, created_at, lead_name, phone, notes')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  const stageCounts: Record<string, number> = {}
  STAGES.forEach(s => { stageCounts[s.key] = 0 })
  stageCounts['rnr'] = 0
  allLeads?.forEach((l: any) => {
    const s = l.pipeline_stage
    if (!s) return
    // RNR = followup with [RNR] tag
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

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
  const yestStart  = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1)
  const yestEnd    = new Date(todayStart); yestEnd.setMilliseconds(-1)

  let todayCalls: any[] = []
  let yesterdayCalls: any[] = []

  // Get current user role
  const { data: currentProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin'

  if (leadIds.length > 0) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Fetch user profiles for name display
      const { data: allProfiles } = await supabaseAdmin
        .from('profiles').select('id, full_name, email')
      const profileMap: Record<string, string> = {}
      allProfiles?.forEach((p: any) => {
        profileMap[p.id] = p.full_name || p.email || 'Unknown'
      })

      // Build today's calls query
      let todayQuery = supabaseAdmin
        .from('lead_activities')
        .select('id, lead_id, title, description, created_at, user_id')
        .in('lead_id', leadIds)
        .eq('type', 'call')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .order('created_at', { ascending: false })

      // Non-admin: only their own calls
      if (!isAdmin) todayQuery = todayQuery.eq('user_id', user.id)

      const { data: todayActs } = await todayQuery
      todayCalls = (todayActs ?? []).map((a: any) => ({
        ...a,
        user_name: a.user_id ? (profileMap[a.user_id] || 'Unknown') : null
      }))

      // Build yesterday's calls query
      let yestQuery = supabaseAdmin
        .from('lead_activities')
        .select('id, lead_id, title, description, created_at, user_id')
        .in('lead_id', leadIds)
        .eq('type', 'call')
        .gte('created_at', yestStart.toISOString())
        .lte('created_at', yestEnd.toISOString())
        .order('created_at', { ascending: false })

      if (!isAdmin) yestQuery = yestQuery.eq('user_id', user.id)

      const { data: yestActs } = await yestQuery
      yesterdayCalls = (yestActs ?? []).map((a: any) => ({
        ...a,
        user_name: a.user_id ? (profileMap[a.user_id] || 'Unknown') : null
      }))
    } catch {}
  }

  const leadMap: Record<string, any> = {}
  allLeads?.forEach((l: any) => { leadMap[l.id] = l })

  // ── CRM Team Call Stats ──
  let crmTeam: any[] = []
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin2 = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all employees in same company
    const { data: employees } = await supabaseAdmin2
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('company_id', profile.company_id)
      .in('role', ['employee', 'tenant_admin', 'admin'])

    if (employees && leadIds.length > 0) {
      // Fetch all call activities for today + yesterday
      const { data: allCallActs } = await supabaseAdmin2
        .from('lead_activities')
        .select('id, lead_id, user_id, created_at, title, description')
        .in('lead_id', leadIds)
        .eq('type', 'call')
        .gte('created_at', yestStart.toISOString())
        .order('created_at', { ascending: false })

      const allCalls = allCallActs ?? []

      crmTeam = employees.map((emp: any) => {
        const empCalls = allCalls.filter((a: any) => a.user_id === emp.id)
        const todayCallsEmp = empCalls.filter((a: any) => new Date(a.created_at) >= todayStart)
        const yestCallsEmp  = empCalls.filter((a: any) => new Date(a.created_at) < todayStart)
        const lastCall = empCalls[0]
        const lastLead = lastCall ? leadMap[lastCall.lead_id] : null

        return {
          id:           emp.id,
          name:         emp.full_name || emp.email || 'Unknown',
          email:        emp.email,
          todayCount:   todayCallsEmp.length,
          yestCount:    yestCallsEmp.length,
          totalCalls:   empCalls.length,
          lastCallTime: lastCall?.created_at ?? null,
          lastCallLead: lastLead?.lead_name ?? null,
          lastCallDesc: lastCall?.description ?? null,
          lastCallId:   lastCall?.lead_id ?? null,
        }
      }).sort((a: any, b: any) => b.todayCount - a.todayCount)
    }
  } catch {}

  const LEAD_BASE = '/dashboard/industries/interior-design/leads'

  return (
    <div className="space-y-6 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
        <h1 className="text-2xl font-bold text-[#1C1712]">Pipeline Dashboard</h1>
        <p className="text-sm text-[#9A8F82] mt-0.5">All stages overview — real time data</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads',  value: String(totalLeads),  color: '#7C3AED', icon: '👥' },
          { label: 'Active',       value: String(activeLeads), color: '#2563EB', icon: '⚡' },
          { label: 'Won',          value: String(wonLeads),    color: '#B8860B', icon: '🏆' },
          { label: 'Added Today',  value: String(todayLeads),  color: '#059669', icon: '📅' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Today's Calls + Yesterday's Calls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's Calls */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#F0EBE0]" style={{ background: '#F0FDF4' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📞</span>
              <p className="text-sm font-black text-[#16A34A]">Today's Calls</p>
            </div>
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: '#16A34A' }}>
              {todayCalls.length}
            </span>
          </div>
          {todayCalls.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-2xl mb-1">📵</p>
              <p className="text-sm text-[#9A8F82] font-medium">No calls logged today</p>
              <p className="text-[10px] text-[#C4BAB0] mt-0.5">Start calling your leads!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F5F1] max-h-64 overflow-y-auto">
              {todayCalls.map((act: any) => {
                const lead = leadMap[act.lead_id]
                return (
                  <Link key={act.id} href={`${LEAD_BASE}/${act.lead_id}`}>
                    <div className="px-4 py-3 hover:bg-[#F0FDF4] transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #16A34A, #047857)' }}>
                          {lead?.lead_name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1C1712] truncate">{lead?.lead_name ?? 'Unknown'}</p>
                          {act.description && <p className="text-[10px] text-[#7A6E60] truncate mt-0.5">{act.description}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] text-[#C4BAB0]">
                              {new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {act.user_name && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: '#F0FDF4', color: '#16A34A' }}>
                                👤 {act.user_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#F0FDF4', color: '#16A34A' }}>📞</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Yesterday's Calls */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#F0EBE0]" style={{ background: '#FFFBEB' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <p className="text-sm font-black text-[#D97706]">Yesterday's Calls</p>
            </div>
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: '#D97706' }}>
              {yesterdayCalls.length}
            </span>
          </div>
          {yesterdayCalls.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-2xl mb-1">📭</p>
              <p className="text-sm text-[#9A8F82] font-medium">No calls logged yesterday</p>
              <p className="text-[10px] text-[#C4BAB0] mt-0.5">Keep track of your daily calls</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F5F1] max-h-64 overflow-y-auto">
              {yesterdayCalls.map((act: any) => {
                const lead = leadMap[act.lead_id]
                return (
                  <Link key={act.id} href={`${LEAD_BASE}/${act.lead_id}`}>
                    <div className="px-4 py-3 hover:bg-[#FFFBEB] transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
                          {lead?.lead_name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1C1712] truncate">{lead?.lead_name ?? 'Unknown'}</p>
                          {act.description && <p className="text-[10px] text-[#7A6E60] truncate mt-0.5">{act.description}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] text-[#C4BAB0]">
                              {new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {act.user_name && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: '#FFFBEB', color: '#D97706' }}>
                                👤 {act.user_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#FFFBEB', color: '#D97706' }}>📋</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CRM Team Section ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color: '#B8860B' }}>CRM Team</p>
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          {crmTeam.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-1">👥</p>
              <p className="text-sm text-[#9A8F82]">No team members found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {crmTeam.map((member: any, i: number) => {
                const GRADIENTS = [
                  ['#7C3AED','#4F46E5'],['#0891B2','#0E7490'],['#059669','#047857'],
                  ['#D97706','#B45309'],['#DB2777','#BE185D'],
                ]
                const g = GRADIENTS[i % GRADIENTS.length]
                const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase() || '?'
                return (
                  <div key={member.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                        {ini(member.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + Email */}
                        <p className="text-sm font-bold text-[#1C1712]">{member.name}</p>
                        <p className="text-[10px] text-[#9A8F82] mt-0.5">{member.email}</p>

                        {/* Call counts */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: member.todayCount > 0 ? '#F0FDF4' : '#F5F0E8' }}>
                            <span className="text-[10px]">📞</span>
                            <span className="text-[10px] font-black" style={{ color: member.todayCount > 0 ? '#16A34A' : '#9A8F82' }}>
                              {member.todayCount} today
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: member.yestCount > 0 ? '#FFFBEB' : '#F5F0E8' }}>
                            <span className="text-[10px]">📋</span>
                            <span className="text-[10px] font-black" style={{ color: member.yestCount > 0 ? '#D97706' : '#9A8F82' }}>
                              {member.yestCount} yesterday
                            </span>
                          </div>
                        </div>

                        {/* Last call */}
                        {member.lastCallLead && member.lastCallId ? (
                          <Link href={`${LEAD_BASE}/${member.lastCallId}`}>
                            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#F0FDF4] transition-colors w-fit"
                              style={{ background: '#F7F5F1', border: '1px solid #E8E2D8' }}>
                              <span className="text-[9px]">🕐</span>
                              <span className="text-[9px] font-bold text-[#1C1712] truncate max-w-[150px]">
                                {member.lastCallLead}
                              </span>
                              <span className="text-[9px] text-[#C4BAB0]">
                                · {new Date(member.lastCallTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <p className="text-[9px] text-[#C4BAB0] mt-2">No calls logged yet</p>
                        )}
                      </div>

                      {/* Total badge */}
                      <div className="flex-shrink-0 text-right">
                        <span className="text-lg font-black" style={{ color: member.totalCalls > 0 ? g[0] : '#C4BAB0' }}>
                          {member.totalCalls}
                        </span>
                        <p className="text-[8px] text-[#C4BAB0]">total</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">{crmTeam.length} team members</p>
            <p className="text-[10px] text-[#B8B0A0]">Based on activity logs</p>
          </div>
        </div>
      </div>

      {/* Conversion + Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFFBEB' }}>
            <TrendingUp className="w-6 h-6" style={{ color: '#B8860B' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider">Conversion Rate</p>
            <p className="text-2xl font-black" style={{ color: '#B8860B' }}>{convRate}%</p>
            <p className="text-[10px] text-[#9A8F82]">{wonLeads} won / {totalLeads} total</p>
          </div>
        </div>
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDF4' }}>
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A8F82] uppercase tracking-wider">Total Pipeline</p>
            <p className="text-2xl font-black" style={{ color: '#059669' }}>
              {totalBudget >= 100000 ? '₹' + (totalBudget / 100000).toFixed(1) + 'L' : '₹' + totalBudget.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-[#9A8F82]">combined budget</p>
          </div>
        </div>
      </div>

      {/* Stage Cards */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color: '#B8860B' }}>Stage Wise Count</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dashboard/industries/interior-design/all-leads">
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5F0E8', border: '1px solid #E2D9C8' }}>
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-2xl font-black" style={{ color: '#1C1712' }}>{totalLeads}</p>
              </div>
              <p className="text-sm font-bold text-[#1C1712] group-hover:underline">All Leads</p>
              <p className="text-[10px] text-[#9A8F82] mt-0.5">All stages combined</p>
              <div className="mt-3 h-1.5 rounded-full" style={{ background: '#F0EBE0' }}>
                <div className="h-1.5 rounded-full w-full" style={{ background: '#1C1712' }} />
              </div>
              <p className="text-[9px] text-[#C4BAB0] mt-1">100% of total</p>
            </div>
          </Link>
          {STAGES.map((stage) => {
            const Icon  = stage.icon
            const count = stageCounts[stage.key] ?? 0
            const pct   = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
            return (
              <Link key={stage.key} href={stage.href}>
                <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stage.bg, border: `1px solid ${stage.border}` }}>
                      <Icon className="w-5 h-5" style={{ color: stage.color }} />
                    </div>
                    <p className="text-2xl font-black" style={{ color: stage.color }}>{count}</p>
                  </div>
                  <p className="text-sm font-bold text-[#1C1712] group-hover:underline">{stage.label}</p>
                  <p className="text-[10px] text-[#9A8F82] mt-0.5 line-clamp-1">{stage.description}</p>
                  <div className="mt-3 h-1.5 rounded-full" style={{ background: '#F0EBE0' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: stage.color, minWidth: count > 0 ? '8px' : '0px' }} />
                  </div>
                  <p className="text-[9px] text-[#C4BAB0] mt-1">{pct}% of total</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Total Leads Breakdown */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-3" style={{ color: '#B8860B' }}>Total Leads Breakdown</p>
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">
          {STAGES.map((stage, i) => {
            const Icon  = stage.icon
            const count = stageCounts[stage.key] ?? 0
            const pct   = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
            return (
              <Link key={stage.key} href={stage.href}>
                <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#FDFAF8] transition-colors ${i !== STAGES.length - 1 ? 'border-b border-[#F0EBE0]' : ''}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stage.bg, border: `1px solid ${stage.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: stage.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-[#1C1712]">{stage.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9A8F82]">{pct}%</span>
                        <span className="text-sm font-black" style={{ color: stage.color }}>{count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#F0EBE0' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: stage.color, minWidth: count > 0 ? '6px' : '0px' }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82] font-medium">Total across all stages</p>
            <p className="text-sm font-black text-[#1C1712]">{totalLeads} leads</p>
          </div>
        </div>
      </div>

      <div className="text-center py-2">
        <p className="text-[10px] text-[#C4BAB0]">Interior Design Pipeline · GK CRM · Real-time data</p>
      </div>
    </div>
  )
}