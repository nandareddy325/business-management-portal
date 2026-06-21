import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { AddClientButton } from '@/components/interior/add-client-button'

export const dynamic = 'force-dynamic'

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

const ini = (name: string) => name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

export default async function IDClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: clients, count } = await supabase
    .from('id_clients')
    .select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')

  const thisMonth = clients?.filter((c: any) => {
    const d = new Date(c.created_at), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length ?? 0

  return (
    <div className="space-y-5 p-4 md:p-4" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Clients</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count ?? 0}</span> total clients
          </p>
        </div>
        <AddClientButton companyId={profile.company_id} projects={projects ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients',    value: count ?? 0,   color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'With Projects',    value: clients?.filter((c: any) => c.project?.project_name).length ?? 0, color: '#B8860B', bg: '#FFFBEB' },
          { label: 'This Month',       value: thisMonth,    color: '#059669', bg: '#F0FDF4' },
        ].map((s, i) => (
          <div key={i} className="border border-[#E2D9C8] rounded-2xl px-4 py-3" style={{ background: s.bg }}>
            <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Empty */}
      {!clients?.length ? (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold">No clients yet</p>
          <p className="text-[#9A8F82] text-sm mt-1">Add your first client to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1C1712' }}>
                  {['#', 'Client', 'Phone', 'Email', 'City', 'Project', 'Added'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5" style={{ color: '#B8860B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(clients ?? []).map((c: any, i: number) => {
                  const av = avatarColors[i % avatarColors.length]
                  return (
                    <tr key={c.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors">
                      <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span></td>
                      <td className="pl-2 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: av.bg, color: av.text }}>{ini(c.name)}</div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1712]">{c.name}</p>
                            {c.notes && <p className="text-[10px] text-[#B8B0A0] truncate max-w-[140px]">{c.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-[#1C1712]">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-[#7A6E60] max-w-[160px] truncate">{c.email ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        {c.city ? <span className="text-[10px] text-[#7A6E60]">📍 {c.city}</span>
                          : <span className="text-[#C4BAB0]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.project?.project_name ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                            🏗️ {c.project.project_name}
                          </span>
                        ) : <span className="text-[10px] text-[#C4BAB0] px-2 py-1 rounded-full bg-[#F5F0E8]">No project</span>}
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-[10px] text-[#B8B0A0] whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {(clients ?? []).map((c: any, i: number) => {
              const av = avatarColors[i % avatarColors.length]
              return (
                <div key={c.id} className="p-4 hover:bg-[#FDFAF8] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: av.bg, color: av.text }}>{ini(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1C1712] truncate">{c.name}</p>
                      <p className="text-xs text-[#7A6E60]">{c.phone ?? '—'}</p>
                    </div>
                    {c.project?.project_name && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#FFFBEB', color: '#B45309' }}>🏗️ {c.project.project_name}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                      <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">Email</p>
                      <p className="text-xs font-semibold text-[#1C1712] mt-0.5 truncate">{c.email ?? '—'}</p>
                    </div>
                    <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                      <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wide">City</p>
                      <p className="text-xs font-semibold text-[#1C1712] mt-0.5">{c.city ? `📍 ${c.city}` : '—'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> clients</p>
            <p className="text-[10px] text-[#B8B0A0]">Interior Design · GK CRM</p>
          </div>
        </div>
      )}
    </div>
  )
}