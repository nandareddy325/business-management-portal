import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import { AddMaterialButton } from '@/components/interior/add-material-button'

export const dynamic = 'force-dynamic'

export default async function MaterialsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: materials, count } = await supabase
    .from('id_materials').select('*, project:projects(project_name)', { count: 'exact' })
    .eq('company_id', profile.company_id).order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects').select('id, project_name')
    .eq('company_id', profile.company_id).eq('industry', 'interior-design')

  const totalCost = (materials ?? []).reduce((s, m: any) => s + (Number(m.quantity||0) * Number(m.unit_cost||0)), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-[#1C1712]">Materials</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5"><span className="text-[#B8860B] font-semibold">{count ?? 0}</span> items · Total: <span className="text-[#B8860B] font-semibold">₹{totalCost.toLocaleString('en-IN')}</span></p></div>
        <AddMaterialButton companyId={profile.company_id} projects={projects ?? []} />
      </div>
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[#E2D9C8] text-left">
            {['Material', 'Category', 'Qty', 'Unit', 'Unit Cost', 'Total', 'Supplier', 'Project'].map(h => (
              <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(materials ?? []).map((m: any) => {
              const total = Number(m.quantity||0) * Number(m.unit_cost||0)
              return (
                <tr key={m.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0EBE0] rounded-xl flex items-center justify-center"><Package className="w-4 h-4 text-[#B8860B]" /></div>
                      <p className="text-sm font-semibold text-[#1C1712]">{m.material_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{m.category ? <span className="text-xs bg-[#F0EBE0] text-[#7A6E60] px-2 py-0.5 rounded-md font-medium">{m.category}</span> : <span className="text-[#B8A99A]">—</span>}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#1C1712]">{m.quantity}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{m.unit}</td>
                  <td className="px-5 py-3.5 text-sm text-[#7A6E60]">₹{Number(m.unit_cost||0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#B8860B]">₹{total.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">{m.supplier ?? '—'}</td>
                  <td className="px-5 py-3.5">{m.project?.project_name ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{m.project.project_name}</span> : <span className="text-[#B8A99A]">—</span>}</td>
                </tr>
              )
            })}
            {!materials?.length && (
              <tr><td colSpan={8} className="py-16 text-center">
                <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3"><Package className="w-6 h-6 text-[#7A6E60]" /></div>
                <p className="text-[#7A6E60] text-sm font-medium">No materials yet</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}