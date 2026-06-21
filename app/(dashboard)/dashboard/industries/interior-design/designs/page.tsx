import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Palette } from 'lucide-react'
import { AddDesignButton } from '@/components/interior/add-design-button'

export const dynamic = 'force-dynamic'

const STYLE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Modern:       { bg: '#EFF6FF', color: '#2563EB', icon: '🏙️' },
  Contemporary: { bg: '#F5F3FF', color: '#7C3AED', icon: '✨' },
  Classic:      { bg: '#FFFBEB', color: '#B45309', icon: '🏛️' },
  Minimalist:   { bg: '#F8FAFC', color: '#475569', icon: '⬜' },
  Traditional:  { bg: '#FFF7ED', color: '#EA580C', icon: '🏺' },
  Industrial:   { bg: '#F1F5F9', color: '#64748B', icon: '🔩' },
  Bohemian:     { bg: '#FDF2F8', color: '#DB2777', icon: '🌸' },
  Scandinavian: { bg: '#F0FDF4', color: '#16A34A', icon: '🌿' },
}

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

export default async function DesignsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: designs, count } = await supabase
    .from('id_designs')
    .select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  const styleCounts: Record<string, number> = {}
  designs?.forEach((d: any) => { if (d.style) styleCounts[d.style] = (styleCounts[d.style] || 0) + 1 })
  const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const withProject = designs?.filter((d: any) => d.project?.project_name).length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-4" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Designs</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> design concepts</p>
        </div>
        <AddDesignButton companyId={profile.company_id} projects={projects ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: String(count ?? 0), color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'With Projects', value: String(withProject), color: '#B8860B', bg: '#FFFBEB' },
          { label: 'Top Style', value: topStyle, color: '#059669', bg: '#F0FDF4', small: true },
        ].map((s, i) => (
          <div key={i} className="border border-[#E2D9C8] rounded-2xl px-4 py-3" style={{ background: s.bg }}>
            <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">{s.label}</p>
            <p className={`font-black mt-1 ${s.small ? 'text-sm' : 'text-2xl'}`} style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Style chips */}
      {Object.keys(styleCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(styleCounts).sort((a, b) => b[1] - a[1]).map(([style, cnt]) => {
            const cfg = STYLE_CONFIG[style] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '🎨' }
            return (
              <div key={style} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                {cfg.icon} {style}
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                  style={{ background: cfg.color }}>{cnt}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty */}
      {!designs?.length ? (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold">No designs yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Add your first design concept</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1C1712' }}>
                  {['#', 'Design', 'Style', 'Project', 'Notes', 'Added'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5" style={{ color: '#B8860B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(designs ?? []).map((d: any, i: number) => {
                  const av = avatarColors[i % avatarColors.length]
                  const cfg = STYLE_CONFIG[d.style] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '🎨' }
                  return (
                    <tr key={d.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i+1}</span></td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: av.bg }}>🎨</div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{d.design_name}</p>
                            {d.room_type && <p className="text-[10px] text-[#B8B0A0]">{d.room_type}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {d.style ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {d.style}</span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {d.project?.project_name ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                            🏗️ {d.project.project_name}
                          </span>
                        ) : <span className="text-[10px] text-[#C4BAB0] px-2 py-0.5 rounded-full bg-[#F5F0E8]">No project</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#7A6E60] max-w-[180px] truncate">{d.notes ?? '—'}</td>
                      <td className="px-4 py-3.5 pr-5 text-[10px] text-[#B8B0A0] whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {(designs ?? []).map((d: any, i: number) => {
              const cfg = STYLE_CONFIG[d.style] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '🎨' }
              const av = avatarColors[i % avatarColors.length]
              return (
                <div key={d.id} className="p-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: av.bg }}>🎨</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1C1712] truncate">{d.design_name}</p>
                      {d.room_type && <p className="text-xs text-[#7A6E60]">{d.room_type}</p>}
                    </div>
                    {d.style && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {d.style}</span>
                    )}
                  </div>
                  {(d.project?.project_name || d.notes) && (
                    <div className="grid grid-cols-1 gap-2">
                      {d.project?.project_name && (
                        <div className="rounded-xl px-3 py-2 border border-[#FDE68A]" style={{ background: '#FFFBEB' }}>
                          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Project</p>
                          <p className="text-xs font-semibold text-amber-800 mt-0.5">🏗️ {d.project.project_name}</p>
                        </div>
                      )}
                      {d.notes && (
                        <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                          <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">Notes</p>
                          <p className="text-xs text-[#1C1712] mt-0.5 line-clamp-2">{d.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> designs</p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}