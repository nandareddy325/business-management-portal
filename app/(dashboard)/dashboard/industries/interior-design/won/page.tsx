import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { LeadTable } from '@/components/interior/lead-table'

export const dynamic = 'force-dynamic'

const SOURCE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Instagram:  { bg: '#FDF2F8', color: '#DB2777', icon: '📸' },
  Facebook:   { bg: '#EFF6FF', color: '#2563EB', icon: '📘' },
  WhatsApp:   { bg: '#F0FDF4', color: '#16A34A', icon: '💬' },
  Referral:   { bg: '#FFFBEB', color: '#D97706', icon: '🤝' },
  'Walk-in':  { bg: '#F5F3FF', color: '#7C3AED', icon: '🚶' },
  Google:     { bg: '#FEF2F2', color: '#DC2626', icon: '🔍' },
  Other:      { bg: '#F5F0E8', color: '#7A6E60', icon: '📌' },
}

interface Lead {
  budget?: string | number
  created_at: string
  source?: string
  [key: string]: unknown
}

export default async function WonPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads').select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'won')
    .order('created_at', { ascending: false })

  const totalRevenue = leads?.reduce((s, l: { budget?: string | number }) => s + Number(l.budget || 0), 0) ?? 0
  const thisMonth    = leads?.filter((l: { created_at: string }) => { const d = new Date(l.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length ?? 0

  // Source breakdown — same pattern as the Lost page
  const sourceCounts: Record<string, number> = {};
  (leads as Lead[] | null)?.forEach((l) => {
    const src = l.source || 'Other'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1712]">Won / Closing 🏆</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> deals closed 🎉</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FFF6DC)',
            color: '#B8860B',
            border: '1px solid #FDE68A',
            boxShadow: '0 4px 14px rgba(184,134,11,0.12)',
          }}
        >
          <Trophy className="w-4 h-4" />Won Stage
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Won',     value: String(count ?? 0), color: '#B8860B' },
          { label: 'This Month',    value: String(thisMonth), color: '#059669' },
          { label: 'Total Revenue', value: totalRevenue >= 100000 ? '₹' + (totalRevenue / 100000).toFixed(1) + 'L' : totalRevenue > 0 ? '₹' + totalRevenue.toLocaleString('en-IN') : '—', color: '#B8860B' },
        ].map((s, i) => (
          <div key={i}
            className="bg-white border border-[#EDE7DB] rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 1px 2px rgba(28,23,18,0.04), 0 8px 20px rgba(28,23,18,0.05)' }}>
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Source breakdown */}
      {Object.keys(sourceCounts).length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, cnt]) => {
            const cfg = SOURCE_CONFIG[src] ?? SOURCE_CONFIG['Other']
            return (
              <div key={src}
                className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                  boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 12px ${cfg.color}14`,
                }}>
                <span className="text-sm leading-none">{cfg.icon}</span>
                <span className="tracking-wide">{src}</span>
                <span
                  className="flex items-center justify-center rounded-full text-[10px] font-black text-white leading-none"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`,
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    boxShadow: `0 2px 6px ${cfg.color}50`,
                  }}>
                  {cnt}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <LeadTable leads={leads ?? []} count={count ?? 0} footerText="deals won 🎉" emptyIcon="🏆" emptyText="No won deals yet" columns={['#', 'Lead', 'Phone', 'Source', 'Budget', 'City', 'Notes', 'Date']} />
    </div>
  )
}