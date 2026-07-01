import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { FollowUpClient } from '@/components/interior/followup-client'

export const dynamic = 'force-dynamic'

// Extract date from description like "📅 04 Jul 2026, 11:00 am"
const extractDateFromDescription = (desc: string): string | null => {
  if (!desc) return null
  // Match pattern: "04 Jul 2026, 11:00 am"
  const match = desc.match(/(\d{2}\s+\w+\s+\d{4}),?\s+(\d{1,2}:\d{2}\s+[ap]m)/i)
  if (match) {
    return `${match[1]}, ${match[2]}`
  }
  return null
}

// Parse "04 Jul 2026, 11:00 am" to ISO format
const parseFollowUpDateString = (dateStr: string): string | null => {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

export default async function FollowUpPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.company_id) redirect('/login')

  // Fetch all interior-design leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, lead_name, phone, email, source, budget, city, interest, notes, created_at, pipeline_stage, property_type, company_id, industry')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  // Fetch follow-up activities (type: 'followup')
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('id, lead_id, description, type, created_at')
    .eq('type', 'followup')
    .order('created_at', { ascending: false })

  // Map activities to leads with extracted dates
  const leadActivityMap = new Map<string, string>()
  activities?.forEach((a: any) => {
    if (!leadActivityMap.has(a.lead_id)) {
      // Extract date from description
      const dateStr = extractDateFromDescription(a.description)
      if (dateStr) {
        const isoDate = parseFollowUpDateString(dateStr)
        if (isoDate) {
          leadActivityMap.set(a.lead_id, isoDate)
        }
      }
    }
  })

  // Enrich leads with follow-up dates
  const leadsWithDates = (leads ?? [])
    .map((l: any) => ({
      ...l,
      date: leadActivityMap.get(l.id) || null
    }))
    .filter((l: any) => l.date !== null)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const overdueLeads = leadsWithDates.filter((l: any) => {
    const d = new Date(l.date)
    d.setHours(0, 0, 0, 0)
    return d < today
  })

  const todayLeads = leadsWithDates.filter((l: any) => {
    const d = new Date(l.date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  const tomorrowLeads = leadsWithDates.filter((l: any) => {
    const d = new Date(l.date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === tomorrow.getTime()
  })

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Follow Up</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{leadsWithDates.length}</span> leads — call reminders based on Next Call Date
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
          style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
          <Calendar className="w-4 h-4" /> Follow Up
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: leadsWithDates.length, color: '#7C3AED', icon: '📋' },
          { label: 'Overdue',  value: overdueLeads.length,   color: '#DC2626', icon: '⚠️' },
          { label: 'Today',    value: todayLeads.length,     color: '#16A34A', icon: '📅' },
          { label: 'Tomorrow', value: tomorrowLeads.length,  color: '#D97706', icon: '🔜' },
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

      <FollowUpClient leads={leadsWithDates} count={leadsWithDates.length} />
    </div>
  )
}