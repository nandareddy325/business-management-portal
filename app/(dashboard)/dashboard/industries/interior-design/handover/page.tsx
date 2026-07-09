import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Phone } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Lead {
  id: string
  lead_name: string
  phone: string
  city?: string
  budget?: string
  property_type?: string
  pipeline_stage?: string
  handover_date: string
  interest?: string
  created_at: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ini = (n: string) => n?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'
const fmtDate = (ds: string) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }

const AVATAR_COLORS = [
  ['#7C3AED','#4F46E5'],['#0891B2','#0E7490'],['#059669','#047857'],
  ['#D97706','#B45309'],['#DB2777','#BE185D'],['#DC2626','#B91C1C'],
]
function getColors(name: string) {
  return AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export default async function HandoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // Fetch all leads with handover_date set
  const { data: leads } = await supabase
    .from('leads')
    .select('id, lead_name, phone, city, budget, property_type, pipeline_stage, handover_date, interest, created_at')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .not('handover_date', 'is', null)
    .order('handover_date', { ascending: true })

  const allLeads = leads ?? []

  // Group by month-year
  const grouped: Record<string, { key: string; month: number; year: number; leads: Lead[] }> = {}

  allLeads.forEach(lead => {
    const d = new Date(lead.handover_date)
    const month = d.getMonth()
    const year = d.getFullYear()
    const key = `${year}-${String(month).padStart(2,'0')}`
    if (!grouped[key]) grouped[key] = { key, month, year, leads: [] }
    grouped[key].leads.push(lead)
  })

  const sortedGroups = Object.values(grouped).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )

  // Stats
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()
  const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1
  const nextYear  = thisMonth === 11 ? thisYear + 1 : thisYear

  const thisMonthCount = allLeads.filter(l => {
    const d = new Date(l.handover_date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length
  const nextMonthCount = allLeads.filter(l => {
    const d = new Date(l.handover_date); return d.getMonth() === nextMonth && d.getFullYear() === nextYear
  }).length
  const overdueCount = allLeads.filter(l => new Date(l.handover_date) < now).length

  const MONTH_COLORS = [
    '#7C3AED','#0891B2','#059669','#D97706','#DB2777','#DC2626',
    '#0369A1','#047857','#B45309','#9D174D','#B91C1C','#4F46E5'
  ]

  return (
    <div style={{ background:'#F7F4EF', minHeight:'100vh', fontFamily:"'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.00s both}
        .fu2{animation:fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.07s both}
        .fu3{animation:fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.14s both}
        .card-hvr{transition:all 0.18s ease}
        .card-hvr:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.09)!important}
        .lead-row{transition:background 0.15s ease}
        .lead-row:hover{background:rgba(184,134,11,0.04)}
      `}</style>

      <div className="px-4 md:px-6 pt-5 pb-10 max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="fu1">
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color:'#B8860B' }}>
            Interior Design · Pipeline
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black" style={{ color:'#1A1612', letterSpacing:'-0.02em' }}>
                Handover Schedule
              </h1>
              <p className="text-sm mt-0.5" style={{ color:'#9A8F82' }}>
                <span className="font-black" style={{ color:'#1A1612' }}>{allLeads.length}</span> leads with handover dates
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold"
              style={{ background:'#ECFEFF', color:'#0891B2', border:'1px solid #A5F3FC' }}>
              📦 Handover
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fu2">
          {[
            { label:'Total',      value:allLeads.length,  color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
            { label:'This Month', value:thisMonthCount,   color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
            { label:'Next Month', value:nextMonthCount,   color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
            { label:'Overdue',    value:overdueCount,     color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
          ].map((s,i) => (
            <div key={i} className="card-hvr rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background:s.bg, border:`1px solid ${s.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-bold" style={{ color:s.color, opacity:0.7 }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Month summary chips */}
        {sortedGroups.length > 0 && (
          <div className="fu2 flex flex-wrap gap-2">
            {sortedGroups.map((grp) => {
              const color = MONTH_COLORS[grp.month]
              const isThisMonth = grp.month === thisMonth && grp.year === thisYear
              return (
                <a key={grp.key} href={`#month-${grp.key}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105"
                  style={{ background: isThisMonth ? color : `${color}15`, color: isThisMonth ? '#fff' : color, border:`1.5px solid ${isThisMonth ? color : color+'30'}`, boxShadow: isThisMonth ? `0 4px 14px ${color}40` : 'none' }}>
                  {MONTHS[grp.month]} {grp.year !== thisYear ? grp.year : ''}
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: isThisMonth ? 'rgba(255,255,255,0.25)' : `${color}25`, color: isThisMonth ? '#fff' : color }}>
                    {grp.leads.length}
                  </span>
                </a>
              )
            })}
          </div>
        )}

        {/* No leads */}
        {sortedGroups.length === 0 && (
          <div className="fu3 rounded-3xl p-16 text-center" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.05)' }}>
            <div className="text-5xl mb-4">📦</div>
            <p className="text-base font-black" style={{ color:'#C4BAB0' }}>No handover dates set yet</p>
            <p className="text-sm mt-1" style={{ color:'#D4CEC8' }}>Open a lead → click &ldquo;Handover Date&rdquo; button</p>
          </div>
        )}

        {/* Month sections */}
        {sortedGroups.map((grp, gi) => {
          const color = MONTH_COLORS[grp.month]
          const isThisMonth = grp.month === thisMonth && grp.year === thisYear
          const isPast = grp.year < thisYear || (grp.year === thisYear && grp.month < thisMonth)

          return (
            <div key={grp.key} id={`month-${grp.key}`}
              className="fu3 rounded-3xl overflow-hidden"
              style={{ background:'#fff', border:`1.5px solid ${color}25`, boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animationDelay:`${gi * 0.04}s` }}>

              {/* Month header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: isThisMonth ? `${color}12` : isPast ? '#FAFAF8' : `${color}08`, borderBottom:`1px solid ${color}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: isPast ? '#C4BAB0' : color, boxShadow: isPast ? 'none' : `0 4px 12px ${color}40` }}>
                    {MONTHS[grp.month]}
                  </div>
                  <div>
                    <p className="text-base font-black" style={{ color:'#1A1612' }}>
                      {MONTH_FULL[grp.month]} {grp.year}
                      {isThisMonth && <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                        style={{ background:color }}>THIS MONTH</span>}
                      {isPast && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'#F5F0E8', color:'#9A8F82' }}>PAST</span>}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: isPast ? '#C4BAB0' : color }}>
                      {grp.leads.length} lead{grp.leads.length > 1 ? 's' : ''} scheduled for handover
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-black" style={{ color: isPast ? '#C4BAB0' : color }}>
                  {grp.leads.length}
                </div>
              </div>

              {/* Leads list */}
              <div>
                {grp.leads.map((lead, i) => {
                  const [c1, c2] = getColors(lead.lead_name || '?')
                  const hDate = new Date(lead.handover_date)
                  const isToday = hDate.toDateString() === now.toDateString()
                  const isOverdue = hDate < now && !isToday

                  return (
                    <div key={lead.id}
                      className="lead-row flex items-center gap-3 px-5 py-4"
                      style={{ borderBottom: i < grp.leads.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>

                      {/* Link wraps avatar + info + date — no <a> nesting issue */}
                      <Link href={`/dashboard/industries/interior-design/leads/${lead.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0" style={{ textDecoration:'none' }}>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                          style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                          {ini(lead.lead_name || '?')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate" style={{ color:'#1A1612' }}>{lead.lead_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-[10px] font-mono" style={{ color:'#9A8F82' }}>{lead.phone}</p>
                            {lead.city && <span className="text-[9px]" style={{ color:'#C4BAB0' }}>📍 {lead.city}</span>}
                            {lead.property_type && <span className="text-[9px]" style={{ color:'#C4BAB0' }}>🏗️ {lead.property_type}</span>}
                            {lead.budget && <span className="text-[9px] font-bold" style={{ color:'#B8860B' }}>💰 {lead.budget}</span>}
                          </div>
                        </div>

                        {/* Handover date */}
                        <div className="flex-shrink-0 text-right">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: isToday ? '#FEF3C7' : isOverdue ? '#FEF2F2' : `${color}12`,
                              color: isToday ? '#92400E' : isOverdue ? '#DC2626' : color,
                              border: `1px solid ${isToday ? '#FDE68A' : isOverdue ? '#FECACA' : color+'30'}`
                            }}>
                            {isToday ? '⭐ Today' : isOverdue ? '⚠️ Overdue' : '📦'}
                            {' '}{fmtDate(lead.handover_date)}
                          </div>
                          {lead.pipeline_stage && (
                            <p className="text-[9px] mt-1 font-bold capitalize" style={{ color:'#C4BAB0' }}>
                              {lead.pipeline_stage}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Call — sibling <a> outside Link, not nested */}
                      <a href={`tel:${lead.phone}`}
                        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
                        <Phone className="w-4 h-4" style={{ color:'#059669' }}/>
                      </a>
                    </div>
                  )
                })}
              </div>

            </div>
          )
        })}

        <p className="text-center text-[10px] pb-2" style={{ color:'#D4CEC8' }}>
          GK CRM · Interior Design · Handover Schedule
        </p>
      </div>
    </div>
  )
}