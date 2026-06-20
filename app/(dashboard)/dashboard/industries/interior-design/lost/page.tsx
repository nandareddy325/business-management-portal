import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XCircle } from 'lucide-react'

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

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

export default async function LostPage() {
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
    .eq('pipeline_stage', 'lost')
    .order('created_at', { ascending: false })

  // Stats
  const thisMonth = leads?.filter((l: any) => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length ?? 0

  const lostBudget = leads?.reduce((s, l: any) => s + Number(l.budget || 0), 0) ?? 0

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  leads?.forEach((l: any) => {
    const src = l.source || 'Other'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>
            Interior Design · Pipeline
          </p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Lost / Not Interested</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads — convert avvaledu
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <XCircle className="w-4 h-4" />
          Lost Stage
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Lost',    value: String(count ?? 0),   color: '#DC2626', isText: false },
          { label: 'This Month',    value: String(thisMonth),     color: '#D97706', isText: false },
          { label: 'Lost Budget',
            value: lostBudget
              ? lostBudget >= 100000
                ? '₹' + (lostBudget / 100000).toFixed(1) + 'L'
                : '₹' + lostBudget.toLocaleString('en-IN')
              : '—',
            color: '#7A6E60', isText: true },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className={`font-black ${s.isText ? 'text-sm' : 'text-xl'}`} style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Source breakdown */}
      {Object.keys(sourceCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, cnt]) => {
            const cfg = SOURCE_CONFIG[src] ?? SOURCE_CONFIG['Other']
            return (
              <div key={src} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                <span>{cfg.icon}</span>
                <span>{src}</span>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                  style={{ background: cfg.color }}>{cnt}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700 font-medium">
          Ee leads future lo re-engage cheyyadaniki try cheyyi — lost permanent kaadu!
        </p>
      </div>

      {/* Table / Empty */}
      {!leads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">No lost leads 🎉</p>
          <p className="text-[#9A8F82] text-sm mt-1">Anni leads convert avutunnay!</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Lead', 'Phone', 'Source', 'Budget', 'City', 'Reason / Notes', 'Date'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l: any, i: number) => {
                  const g   = GRADIENTS[i % GRADIENTS.length]
                  const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
                  return (
                    <tr key={l.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5">
                        <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                      </td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Greyed out avatar for lost */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 opacity-50"
                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
                            {ini(l.lead_name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#7A6E60]">{l.lead_name}</p>
                            {l.property_type && <p className="text-[10px] text-[#C4BAB0]">{l.property_type}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-mono text-[#9A8F82]">{l.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {l.source ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full opacity-70"
                            style={{ background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>
                            {src.icon} {l.source}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.budget ? (
                          <p className="text-sm font-bold text-[#9A8F82] line-through">
                            ₹{Number(l.budget).toLocaleString('en-IN')}
                          </p>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.city ? (
                          <span className="text-[10px] text-[#9A8F82]">📍 {l.city}</span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#9A8F82] max-w-[180px] truncate">{l.notes ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <p className="text-[10px] text-[#C4BAB0] whitespace-nowrap">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {leads.map((l: any, i: number) => {
              const g   = GRADIENTS[i % GRADIENTS.length]
              const src = SOURCE_CONFIG[l.source] ?? SOURCE_CONFIG['Other']
              return (
                <div key={l.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 opacity-50"
                      style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
                      {ini(l.lead_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#7A6E60]">{l.lead_name}</p>
                        {l.budget && (
                          <p className="text-sm font-black flex-shrink-0 text-[#C4BAB0] line-through">
                            ₹{Number(l.budget).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[#C4BAB0] mt-0.5">{l.phone ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {l.source && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full opacity-70"
                            style={{ background: src.bg, color: src.color }}>
                            {src.icon} {l.source}
                          </span>
                        )}
                        {l.city && <span className="text-[10px] text-[#C4BAB0]">📍 {l.city}</span>}
                        <span className="text-[10px] text-[#C4BAB0]">
                          {new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      {l.notes && (
                        <p className="text-[10px] text-[#9A8F82] mt-1.5 line-clamp-2">{l.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{count ?? 0}</span> lost leads
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}