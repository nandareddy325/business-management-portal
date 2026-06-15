import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import { AddMaterialButton } from '@/components/interior/add-material-button'

export const dynamic = 'force-dynamic'

const CATEGORY_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  Flooring:    { bg: '#FFF7ED', color: '#EA580C', icon: '🪵' },
  Furniture:   { bg: '#F5F3FF', color: '#7C3AED', icon: '🪑' },
  Lighting:    { bg: '#FFFBEB', color: '#D97706', icon: '💡' },
  Paint:       { bg: '#EFF6FF', color: '#2563EB', icon: '🎨' },
  Fabric:      { bg: '#FDF2F8', color: '#DB2777', icon: '🧵' },
  Hardware:    { bg: '#F1F5F9', color: '#475569', icon: '🔩' },
  Glass:       { bg: '#ECFEFF', color: '#0891B2', icon: '🪟' },
  Electrical:  { bg: '#FEF2F2', color: '#DC2626', icon: '⚡' },
  Plumbing:    { bg: '#F0FDF4', color: '#16A34A', icon: '🚿' },
  Tiles:       { bg: '#FAFAF8', color: '#64748B', icon: '🔲' },
}

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

export default async function MaterialsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: materials, count } = await supabase
    .from('id_materials')
    .select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  const totalCost = (materials ?? []).reduce((s, m: any) =>
    s + (Number(m.quantity || 0) * Number(m.unit_cost || 0)), 0)

  const categoryCosts: Record<string, number> = {}
  ;(materials ?? []).forEach((m: any) => {
    const cat = m.category || 'Other'
    const cost = Number(m.quantity || 0) * Number(m.unit_cost || 0)
    categoryCosts[cat] = (categoryCosts[cat] || 0) + cost
  })
  const topCategory = Object.entries(categoryCosts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const withProject = (materials ?? []).filter((m: any) => m.project?.project_name).length

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>
            Interior Design
          </p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Materials</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> items ·{' '}
            Total: <span className="font-bold" style={{ color: '#B8860B' }}>{fmt(totalCost)}</span>
          </p>
        </div>
        <AddMaterialButton companyId={profile.company_id} projects={projects ?? []} />
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Items',   value: String(count ?? 0),  color: '#7C3AED', isText: false },
          { label: 'Total Cost',    value: fmt(totalCost),       color: '#B8860B', isText: true  },
          { label: 'Top Category',  value: topCategory,          color: '#059669', isText: true  },
          { label: 'With Projects', value: String(withProject),  color: '#2563EB', isText: false },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className={`font-black ${s.isText ? 'text-sm' : 'text-xl'}`} style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Category cost breakdown chips ── */}
      {Object.keys(categoryCosts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCosts).sort((a, b) => b[1] - a[1]).map(([cat, cost]) => {
            const cfg = CATEGORY_CONFIG[cat] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '📦' }
            return (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                <span>{cfg.icon}</span>
                <span>{cat}</span>
                <span className="text-[10px] opacity-70">{fmt(cost)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Table / Empty ── */}
      {!(materials ?? []).length ? (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-base">No materials yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Add materials to track costs</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  {['#', 'Material', 'Category', 'Qty', 'Unit', 'Unit Cost', 'Total', 'Supplier', 'Project'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(materials ?? []).map((m: any, i: number) => {
                  const total = Number(m.quantity || 0) * Number(m.unit_cost || 0)
                  const g = GRADIENTS[i % GRADIENTS.length]
                  const cfg = CATEGORY_CONFIG[m.category] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '📦' }
                  return (
                    <tr key={m.id}
                      className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5">
                        <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                      </td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${g[0]}18, ${g[1]}18)`, border: `1px solid ${g[0]}30` }}>
                            {cfg.icon}
                          </div>
                          <p className="text-sm font-bold text-[#1C1712]">{m.material_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {m.category ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                            {cfg.icon} {m.category}
                          </span>
                        ) : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-[#1C1712]">{m.quantity}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#7A6E60]">{m.unit ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-[#7A6E60]">{fmt(Number(m.unit_cost || 0))}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold" style={{ color: '#B8860B' }}>{fmt(total)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[#7A6E60]">{m.supplier ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        {m.project?.project_name ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309' }}>
                            🏗️ {m.project.project_name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#C4BAB0] px-2 py-0.5 rounded-full bg-[#F5F0E8]">
                            No project
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Total footer row */}
              <tfoot>
                <tr style={{ background: '#F5F0E8', borderTop: '2px solid #E8E2D8' }}>
                  <td colSpan={6} className="pl-5 py-3 text-xs font-black text-[#7A6E60] uppercase tracking-wider">
                    Total Cost
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-base font-black" style={{ color: '#B8860B' }}>{fmt(totalCost)}</p>
                  </td>
                  <td colSpan={2} className="pr-5 py-3 text-right">
                    <p className="text-[10px] text-[#B8B0A0]">{count} items</p>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {(materials ?? []).map((m: any, i: number) => {
              const total = Number(m.quantity || 0) * Number(m.unit_cost || 0)
              const cfg = CATEGORY_CONFIG[m.category] ?? { bg: '#F5F0E8', color: '#7A6E60', icon: '📦' }
              return (
                <div key={m.id} className="px-4 py-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1C1712]">{m.material_name}</p>
                        <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{fmt(total)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[#7A6E60]">
                          {m.quantity} {m.unit} × {fmt(Number(m.unit_cost || 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {m.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.icon} {m.category}
                          </span>
                        )}
                        {m.project?.project_name && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#FFFBEB', color: '#B45309' }}>
                            🏗️ {m.project.project_name}
                          </span>
                        )}
                        {m.supplier && (
                          <span className="text-[10px] text-[#9A8F82]">📦 {m.supplier}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Mobile total */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#F5F0E8' }}>
              <p className="text-xs font-black text-[#7A6E60] uppercase tracking-wider">Total Cost</p>
              <p className="text-base font-black" style={{ color: '#B8860B' }}>{fmt(totalCost)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between hidden md:flex"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{count ?? 0}</span> materials total
            </p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}