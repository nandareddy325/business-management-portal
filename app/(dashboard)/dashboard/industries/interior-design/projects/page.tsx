import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { AddProjectButton } from '@/components/interior/add-project-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; text: string }> = {
  planning:    { bg: 'bg-blue-50',    text: 'text-blue-700' },
  in_progress: { bg: 'bg-amber-50',   text: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  on_hold:     { bg: 'bg-red-50',     text: 'text-red-600' },
}

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1712]">Projects</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5"><span className="text-[#B8860B] font-semibold">{total}</span> total projects</p>
        </div>
        <AddProjectButton companyId={profile.company_id} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: total,     bg: 'bg-[#FDFAF4]',  text: 'text-[#1C1712]',   icon: '🏗️' },
          { label: 'Active',    value: active,    bg: 'bg-amber-50',   text: 'text-amber-700',   icon: '🔥' },
          { label: 'Completed', value: completed, bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✅' },
          { label: 'Budget',    value: `₹${(totalBudget/1000).toFixed(1)}K`, bg: 'bg-[#FDFAF4]', text: 'text-[#B8860B]', icon: '💰' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{s.icon}</span><p className="text-xs text-[#7A6E60] font-medium">{s.label}</p></div>
            <p className={`text-2xl font-bold font-serif ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2D9C8] text-left">
              {['Project', 'Client', 'Budget', 'Status', 'Start', 'Deadline', 'Notes'].map(h => (
                <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(projects ?? []).map((p: any) => {
              const s = statusStyle[p.status] ?? statusStyle.planning
              return (
                <tr key={p.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#F0EBE0] rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-4 h-4 text-[#B8860B]" />
                      </div>
                      <p className="text-sm font-semibold text-[#1C1712]">{p.project_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#7A6E60]">{p.client_name}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#1C1712]">₹{Number(p.budget||0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${s.bg} ${s.text}`}>{p.status?.replace('_',' ')}</span></td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60] max-w-[160px] truncate">{p.notes ?? '—'}</td>
                </tr>
              )
            })}
            {!projects?.length && (
              <tr><td colSpan={7} className="py-16 text-center">
                <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3"><FolderOpen className="w-6 h-6 text-[#7A6E60]" /></div>
                <p className="text-[#7A6E60] text-sm font-medium">No projects yet</p>
                <p className="text-[#B8A99A] text-xs mt-1">Click "+ Add Project" to get started</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}