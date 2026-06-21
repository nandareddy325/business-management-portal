import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { AddProjectButton } from '@/components/interior/add-project-button'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  planning:    { bg: '#EFF6FF', color: '#2563EB', icon: '📋', label: 'Planning' },
  in_progress: { bg: '#FFFBEB', color: '#D97706', icon: '🔥', label: 'In Progress' },
  completed:   { bg: '#F0FDF4', color: '#16A34A', icon: '✅', label: 'Completed' },
  on_hold:     { bg: '#FEF2F2', color: '#DC2626', icon: '⏸️', label: 'On Hold' },
}

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

const ini = (name: string) => name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: projects, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .order('created_at', { ascending: false })

  const total = count ?? 0
  const active = projects?.filter(p => p.status === 'in_progress').length ?? 0
  const completed = projects?.filter(p => p.status === 'completed').length ?? 0
  const totalBudget = projects?.reduce((s, p) => s + Number(p.budget || 0), 0) ?? 0
  const today = new Date()
  const overdue = projects?.filter(p =>
    p.deadline && new Date(p.deadline) < today && p.status !== 'completed'
  ).length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-4" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Projects</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{total}</span> projects ·{' '}
            <span className="font-bold" style={{ color: '#B8860B' }}>
              {totalBudget >= 100000 ? `₹${(totalBudget/100000).toFixed(1)}L` : fmt(totalBudget)}
            </span> pipeline
          </p>
        </div>
        <AddProjectButton companyId={profile.company_id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: String(total),     color: '#7C3AED', bg: '#F5F3FF', icon: '🏗️' },
          { label: 'Active',    value: String(active),    color: '#D97706', bg: '#FFFBEB', icon: '🔥' },
          { label: 'Completed', value: String(completed), color: '#16A34A', bg: '#F0FDF4', icon: '✅' },
          { label: 'Budget',    value: totalBudget >= 100000 ? `₹${(totalBudget/100000).toFixed(1)}L` : fmt(totalBudget),
            color: '#B8860B', bg: '#FDFAF4', icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="border border-[#E2D9C8] rounded-2xl p-4" style={{ background: s.bg }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue warning */}
      {overdue > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200" style={{ background: '#FEF2F2' }}>
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-bold text-red-700">{overdue} project{overdue > 1 ? 's' : ''} overdue!</p>
        </div>
      )}

      {/* Status chips */}
      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const cnt = projects?.filter(p => p.status === key).length ?? 0
            if (!cnt) return null
            return (
              <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                {cfg.icon} {cfg.label}
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                  style={{ background: cfg.color }}>{cnt}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty */}
      {!projects?.length ? (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold">No projects yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Click "+ Add Project" to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1C1712' }}>
                  {['#', 'Project', 'Client', 'Budget', 'Status', 'Start', 'Deadline', 'Notes'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5" style={{ color: '#B8860B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(projects ?? []).map((p: any, i: number) => {
                  const av = avatarColors[i % avatarColors.length]
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
                  const isOverdue = p.deadline && new Date(p.deadline) < today && p.status !== 'completed'
                  return (
                    <tr key={p.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors"
                      style={{ background: isOverdue ? '#FFF5F5' : undefined }}>
                      <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i+1}</span></td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: av.bg, color: av.text }}>{ini(p.project_name)}</div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{p.project_name}</p>
                            {isOverdue && <p className="text-[9px] font-bold text-red-500">⚠ Overdue</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#7A6E60]">{p.client_name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-[#1C1712]">{fmt(Number(p.budget||0))}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-[#7A6E60] whitespace-nowrap">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`text-[10px] whitespace-nowrap font-medium ${isOverdue ? 'text-red-500' : 'text-[#7A6E60]'}`}>
                          {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-xs text-[#7A6E60] max-w-[140px] truncate">{p.notes ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {(projects ?? []).map((p: any, i: number) => {
              const av = avatarColors[i % avatarColors.length]
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
              const isOverdue = p.deadline && new Date(p.deadline) < today && p.status !== 'completed'
              return (
                <div key={p.id} className="p-4" style={{ background: isOverdue ? '#FFF5F5' : undefined }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: av.bg, color: av.text }}>{ini(p.project_name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1C1712] truncate">{p.project_name}</p>
                      {p.client_name && <p className="text-xs text-[#7A6E60]">{p.client_name}</p>}
                    </div>
                    <p className="text-sm font-black flex-shrink-0" style={{ color: '#B8860B' }}>{fmt(Number(p.budget||0))}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: cfg.bg }}>
                      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: cfg.color }}>Status</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</p>
                    </div>
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                      <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">Deadline</p>
                      <p className={`text-xs font-bold mt-0.5 ${isOverdue ? 'text-red-500' : 'text-[#1C1712]'}`}>
                        {p.deadline ? `${isOverdue ? '⚠ ' : '📅 '}${new Date(p.deadline).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]"><span className="font-bold text-[#1C1712]">{total}</span> projects · <span className="font-bold text-[#B8860B]">{fmt(totalBudget)}</span></p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}