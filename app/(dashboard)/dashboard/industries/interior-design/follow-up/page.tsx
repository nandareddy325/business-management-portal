import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

function getDateLabel(dateStr: string) {
  if (!dateStr) return null
  const date  = new Date(dateStr)
  const today = new Date()
  const tom   = new Date()
  tom.setDate(today.getDate() + 1)

  const d = date.toDateString()
  if (d === today.toDateString()) return { label: 'Today',    color: '#16A34A', bg: '#F0FDF4' }
  if (d === tom.toDateString())   return { label: 'Tomorrow', color: '#D97706', bg: '#FFFBEB' }
  if (date < today)               return { label: 'Overdue',  color: '#DC2626', bg: '#FEF2F2' }
  return null
}

export default async function FollowUpPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'followup')
    .order('date', { ascending: true })

  const today    = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // Date-wise buckets
  const overdueLeads  = leads?.filter((l: any) => l.date && new Date(l.date) < today) ?? []
  const todayLeads    = leads?.filter((l: any) => l.date && new Date(l.date).toDateString() === today.toDateString()) ?? []
  const tomorrowLeads = leads?.filter((l: any) => l.date && new Date(l.date).toDateString() === tomorrow.toDateString()) ?? []
  const upcomingLeads = leads?.filter((l: any) => l.date && new Date(l.date) > tomorrow) ?? []
  const noDateLeads   = leads?.filter((l: any) => !l.date) ?? []

  const LeadRow = ({ l, i }: { l: any; i: number }) => {
    const g      = GRADIENTS[i % GRADIENTS.length]
    const src    = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
    const int    = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
    const dlabel = getDateLabel(l.date)

    return (
      <>
        {/* Desktop Row */}
        <tr className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors cursor-pointer hidden md:table-row">
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
                {l.interest && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: int.bg, color: int.color }}>
                    {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <p className="text-sm font-mono text-[#1C1712]">{l.phone ?? '—'}</p>
          </td>
          <td className="px-4 py-3.5">
            {/* Follow-up date */}
            {l.date ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-bold text-[#1C1712]">
                  {new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                {dlabel && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit"
                    style={{ background: dlabel.bg, color: dlabel.color }}>
                    {dlabel.label === 'Overdue' ? '⚠️' : dlabel.label === 'Today' ? '📅' : '🔜'} {dlabel.label}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-[#C4BAB0]">No date set</span>
            )}
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
              <p className="text-sm font-bold" style={{ color: '#B8860B' }}>
                ₹{Number(l.budget).toLocaleString('en-IN')}
              </p>
            ) : <span className="text-[#C4BAB0]">—</span>}
          </td>
          <td className="px-4 py-3.5">
            <p className="text-xs text-[#7A6E60] max-w-[160px] truncate">{l.notes ?? '—'}</p>
          </td>
        </tr>

        {/* Mobile Card — wrapped in tr/td to avoid hydration error */}
        <tr className="md:hidden border-b border-[#F0EBE0]">
          <td colSpan={7} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
              {ini(l.lead_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                {l.budget && (
                  <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>
                    ₹{Number(l.budget).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <p className="text-xs text-[#9A8F82] mt-0.5">{l.phone ?? '—'}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {l.date && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: dlabel?.bg ?? '#F5F0E8',
                      color: dlabel?.color ?? '#7A6E60'
                    }}>
                    📅 {new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {dlabel && ` · ${dlabel.label}`}
                  </span>
                )}
                {l.interest && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: int.bg, color: int.color }}>
                    {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}
                  </span>
                )}
                {l.source && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: src.bg, color: src.color }}>
                    {src.icon} {l.source}
                  </span>
                )}
              </div>
              {l.notes && (
                <p className="text-[10px] text-[#9A8F82] mt-1.5 line-clamp-2">{l.notes}</p>
              )}
            </div>
          </div>
          </td>
        </tr>
      </>
    )
  }

  const SectionHeader = ({ title, count, color, bg, border, icon }: any) => (
    <tr className="hidden md:table-row">
      <td colSpan={7} className="px-5 py-2.5"
        style={{ background: bg, borderTop: '1px solid #F0EBE0', borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>
            {title}
          </p>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: color }}>{count}</span>
        </div>
      </td>
    </tr>
  )

  const MobileSectionHeader = ({ title, count, color, bg, icon }: any) => (
    <tr className="md:hidden">
      <td colSpan={7} className="px-4 py-2"
        style={{ background: bg, borderTop: '1px solid #F0EBE0' }}>
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{title}</p>
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ml-1"
            style={{ background: color }}>{count}</span>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>
            Interior Design · Pipeline
          </p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Follow Up</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads — date wise follow up cheyali
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
          <Calendar className="w-4 h-4" />
          Follow Up Stage
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: count ?? 0,           color: '#7C3AED', icon: '📋' },
          { label: 'Overdue',  value: overdueLeads.length,  color: '#DC2626', icon: '⚠️' },
          { label: 'Today',    value: todayLeads.length,    color: '#16A34A', icon: '📅' },
          { label: 'Tomorrow', value: tomorrowLeads.length, color: '#D97706', icon: '🔜' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{s.icon}</span>
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            </div>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue Warning */}
      {overdueLeads.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700">
            {overdueLeads.length} lead{overdueLeads.length > 1 ? 's' : ''} overdue — veelatho contact cheyyali!
          </p>
        </div>
      )}

      {/* Today reminder */}
      {todayLeads.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-bold text-green-700">
            {todayLeads.length} lead{todayLeads.length > 1 ? 's' : ''} today call cheyali! Ivvaale!
          </p>
        </div>
      )}

      {/* Main Table */}
      {!leads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">No follow-up leads</p>
          <p className="text-[#9A8F82] text-sm mt-1">Leads move here when follow-up date is set</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop Table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                {['#', 'Lead', 'Phone', 'Follow-up Date', 'Source', 'Budget', 'Notes'].map(h => (
                  <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overdueLeads.length > 0 && (
                <>
                  <SectionHeader title="Overdue" count={overdueLeads.length} color="#DC2626" bg="#FEF2F2" border="#FECACA" icon="⚠️" />
                  {overdueLeads.map((l, i) => <LeadRow key={l.id} l={l} i={i} />)}
                </>
              )}
              {todayLeads.length > 0 && (
                <>
                  <SectionHeader title="Today" count={todayLeads.length} color="#16A34A" bg="#F0FDF4" border="#BBF7D0" icon="📅" />
                  {todayLeads.map((l, i) => <LeadRow key={l.id} l={l} i={i} />)}
                </>
              )}
              {tomorrowLeads.length > 0 && (
                <>
                  <SectionHeader title="Tomorrow" count={tomorrowLeads.length} color="#D97706" bg="#FFFBEB" border="#FDE68A" icon="🔜" />
                  {tomorrowLeads.map((l, i) => <LeadRow key={l.id} l={l} i={i} />)}
                </>
              )}
              {upcomingLeads.length > 0 && (
                <>
                  <SectionHeader title="Upcoming" count={upcomingLeads.length} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" icon="📆" />
                  {upcomingLeads.map((l, i) => <LeadRow key={l.id} l={l} i={i} />)}
                </>
              )}
              {noDateLeads.length > 0 && (
                <>
                  <SectionHeader title="No Date Set" count={noDateLeads.length} color="#7A6E60" bg="#F5F0E8" border="#E2D9C8" icon="❓" />
                  {noDateLeads.map((l, i) => <LeadRow key={l.id} l={l} i={i} />)}
                </>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{count ?? 0}</span> follow-up leads
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}