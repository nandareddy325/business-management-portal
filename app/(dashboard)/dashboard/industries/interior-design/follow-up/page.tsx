import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

export const dynamic = 'force-dynamic'

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

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const overdueLeads  = leads?.filter((l: any) => l.date && new Date(l.date) < today) ?? []
  const todayLeads    = leads?.filter((l: any) => l.date && new Date(l.date).toDateString() === today.toDateString()) ?? []
  const tomorrowLeads = leads?.filter((l: any) => l.date && new Date(l.date).toDateString() === tomorrow.toDateString()) ?? []
  const upcomingLeads = leads?.filter((l: any) => l.date && new Date(l.date) > tomorrow) ?? []
  const noDateLeads   = leads?.filter((l: any) => !l.date) ?? []

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
          <Calendar className="w-4 h-4" />Follow Up Stage
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

      {/* Sections using LeadTable — click chesthe /leads/{id} page ki navigate avutundi */}
      {!leads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">No follow-up leads</p>
          <p className="text-[#9A8F82] text-sm mt-1">Leads move here when follow-up date is set</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">⚠️</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#DC2626' }}>Overdue</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#DC2626' }}>{overdueLeads.length}</span>
              </div>
              <LeadTable leads={overdueLeads} count={overdueLeads.length} footerText="overdue leads"
                columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="⚠️" emptyText="" />
            </div>
          )}
          {todayLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">📅</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#16A34A' }}>Today</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#16A34A' }}>{todayLeads.length}</span>
              </div>
              <LeadTable leads={todayLeads} count={todayLeads.length} footerText="today"
                columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="📅" emptyText="" />
            </div>
          )}
          {tomorrowLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">🔜</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#D97706' }}>Tomorrow</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#D97706' }}>{tomorrowLeads.length}</span>
              </div>
              <LeadTable leads={tomorrowLeads} count={tomorrowLeads.length} footerText="tomorrow"
                columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="🔜" emptyText="" />
            </div>
          )}
          {upcomingLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">📆</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#7C3AED' }}>Upcoming</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#7C3AED' }}>{upcomingLeads.length}</span>
              </div>
              <LeadTable leads={upcomingLeads} count={upcomingLeads.length} footerText="upcoming"
                columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="📆" emptyText="" />
            </div>
          )}
          {noDateLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">❓</span>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#7A6E60' }}>No Date Set</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#7A6E60' }}>{noDateLeads.length}</span>
              </div>
              <LeadTable leads={noDateLeads} count={noDateLeads.length} footerText="no date"
                columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'Notes', 'Date']} emptyIcon="❓" emptyText="" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}