import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { FollowUpClient } from '@/components/interior/followup-client'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
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
      <FollowUpClient leads={leads ?? []} count={count ?? 0} />
    </div>
  )
}