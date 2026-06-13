import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Palette } from 'lucide-react'
import { AddDesignButton } from '@/components/interior/add-design-button'

export const dynamic = 'force-dynamic'

const styleColors: Record<string, { bg: string; text: string }> = {
  Modern:       { bg: 'bg-blue-50',    text: 'text-blue-700' },
  Contemporary: { bg: 'bg-purple-50',  text: 'text-purple-700' },
  Classic:      { bg: 'bg-amber-50',   text: 'text-amber-700' },
  Minimalist:   { bg: 'bg-slate-50',   text: 'text-slate-700' },
  Traditional:  { bg: 'bg-orange-50',  text: 'text-orange-700' },
  Industrial:   { bg: 'bg-gray-100',   text: 'text-gray-700' },
}

export default async function DesignsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: designs, count } = await supabase
    .from('id_designs').select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id).order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id).eq('industry', 'interior-design')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-[#1C1712]">Designs</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5"><span className="text-[#B8860B] font-semibold">{count ?? 0}</span> designs</p></div>
        <AddDesignButton companyId={profile.company_id} projects={projects ?? []} />
      </div>
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[#E2D9C8] text-left">
            {['Design', 'Style', 'Project', 'Notes', 'Added'].map(h => (
              <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(designs ?? []).map((d: any) => {
              const s = styleColors[d.style] ?? { bg: 'bg-[#F0EBE0]', text: 'text-[#7A6E60]' }
              return (
                <tr key={d.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0EBE0] rounded-xl flex items-center justify-center"><Palette className="w-4 h-4 text-[#B8860B]" /></div>
                      <p className="text-sm font-semibold text-[#1C1712]">{d.design_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{d.style ? <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{d.style}</span> : <span className="text-[#B8A99A]">—</span>}</td>
                  <td className="px-5 py-3.5">{d.project?.project_name ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{d.project.project_name}</span> : <span className="text-[#B8A99A]">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60] max-w-[200px] truncate">{d.notes ?? '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              )
            })}
            {!designs?.length && (
              <tr><td colSpan={5} className="py-16 text-center">
                <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3"><Palette className="w-6 h-6 text-[#7A6E60]" /></div>
                <p className="text-[#7A6E60] text-sm font-medium">No designs yet</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}