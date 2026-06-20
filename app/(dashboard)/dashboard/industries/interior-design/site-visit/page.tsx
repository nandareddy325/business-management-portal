import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'

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

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')

export default async function SiteVisitPage() {
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
    .eq('pipeline_stage', 'sitevisit')
    .order('created_at', { ascending: false })

  // Stats
  const totalBudget  = leads?.reduce((s, l: any) => s + Number(l.budget || 0), 0) ?? 0
  const highInterest = leads?.filter((l: any) => l.interest === 'High').length ?? 0
  const withCity     = leads?.filter((l: any) => l.city).length ?? 0

  // City breakdown
  const cityCounts: Record<string, number> = {}
  leads?.forEach((l: any) => {
    if (l.city) cityCounts[l.city] = (cityCounts[l.city] || 0) + 1
  })

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>
            Interior Design · Pipeline
          </p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Site Visit</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads — site visit scheduled / completed
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#ECFEFF', color: '#0891B2', border: '1px solid #A5F3FC' }}>
          <MapPin className="w-4 h-4" />
          Site Visit Stage
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Visits',   value: String(count ?? 0),   color: '#0891B2', isText: false },
          { label: 'High Interest',  value: String(highInterest), color: '#059669', isText: false },
          { label: 'Total Pipeline',
            value: totalBudget >= 100000
              ? '₹' + (totalBudget / 100000).toFixed(1) + 'L'
              : totalBudget > 0 ? fmt(totalBudget) : '—',
            color: '#B8860B', isText: true },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className={`font-black ${s.isText ? 'text-sm' : 'text-xl'}`} style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* City breakdown chips */}
      {Object.keys(cityCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).map(([city, cnt]) => (
            <div key={city} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: '#ECFEFF', color: '#0891B2', border: '1px solid #A5F3FC30' }}>
              <span>📍</span>
              <span>{city}</span>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                style={{ background: '#0891B2' }}>{cnt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#ECFEFF', border: '1px solid #A5F3FC' }}>
        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#0891B2' }} />
        <p className="text-sm font-medium" style={{ color: '#164E63' }}>
          Ee leads site visit ki ready — quotation step ki move cheyyandi!
        </p>
      </div>

      {/* Table / Empty */}
      {!leads?.length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">No site visits yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Leads move here when site visit is scheduled</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Lead', 'Phone', 'Source', 'Interest', 'Budget', 'City', 'Property', 'Notes', 'Date'].map(h => (
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
                  const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
                  return (
                    <tr key={l.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                      <td className="pl-5 pr-2 py-3.5">
                        <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                      </td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                            {ini(l.lead_name)}
                          </div>
                          <p className="text-sm font-bold text-[#1C1712]">{l.lead_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-mono text-[#1C1712]">{l.phone ?? '—'}</p>
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
                        {l.interest ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: int.bg, color: int.color, border: `1px solid ${int.color}30` }}>
                            {l.interest === 'High' ? '🔥' : l.interest === 'Medium' ? '⚡' : '❄️'} {l.interest}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.budget ? (
                          <p className="text-sm font-bold" style={{ color: '#B8860B' }}>
                            {fmt(Number(l.budget))}
                          </p>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.city ? (
                          <span className="text-[10px] font-medium text-[#0891B2]">📍 {l.city}</span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {l.property_type ? (
                          <span className="text-[10px] text-[#7A6E60] px-2 py-0.5 rounded-full"
                            style={{ background: '#F5F0E8' }}>
                            🏠 {l.property_type}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#7A6E60] max-w-[140px] truncate">{l.notes ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <p className="text-[10px] text-[#B8B0A0] whitespace-nowrap">
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
              const int = INTEREST_CONFIG[l.interest] ?? { bg: '#F5F0E8', color: '#7A6E60' }
              return (
                <div key={l.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
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
                            {fmt(Number(l.budget))}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[#9A8F82] mt-0.5">{l.phone ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {l.city && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#ECFEFF', color: '#0891B2' }}>
                            📍 {l.city}
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
                        {l.property_type && (
                          <span className="text-[10px] text-[#7A6E60] px-2 py-0.5 rounded-full"
                            style={{ background: '#F5F0E8' }}>
                            🏠 {l.property_type}
                          </span>
                        )}
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
              <span className="font-bold text-[#1C1712]">{count ?? 0}</span> site visits
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}