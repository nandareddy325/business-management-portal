import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { AddClientButton } from '@/components/interior/add-client-button'

export const dynamic = 'force-dynamic'

export default async function IDClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: clients, count } = await supabase
    .from('id_clients').select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id).order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id).eq('industry', 'interior-design')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-[#1C1712]">Clients</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5"><span className="text-[#B8860B] font-semibold">{count ?? 0}</span> clients</p></div>
        <AddClientButton companyId={profile.company_id} projects={projects ?? []} />
      </div>
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[#E2D9C8] text-left">
            {['Client', 'Phone', 'Email', 'City', 'Project', 'Added'].map(h => (
              <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(clients ?? []).map((c: any, i: number) => (
              <tr key={c.id} className="hover:bg-[#F5F0E8] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F0EBE0] rounded-xl flex items-center justify-center text-xs font-bold text-[#B8860B]">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-[#1C1712]">{c.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#7A6E60]">{c.phone ?? '—'}</td>
                <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{c.email ?? '—'}</td>
                <td className="px-5 py-3.5 text-sm text-[#7A6E60]">{c.city ?? '—'}</td>
                <td className="px-5 py-3.5">
                  {c.project?.project_name
                    ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{c.project.project_name}</span>
                    : <span className="text-[#B8A99A]">—</span>}
                </td>
                <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!clients?.length && (
              <tr><td colSpan={6} className="py-16 text-center">
                <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-[#7A6E60]" /></div>
                <p className="text-[#7A6E60] text-sm font-medium">No clients yet</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}