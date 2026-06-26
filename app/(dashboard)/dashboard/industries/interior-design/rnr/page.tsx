import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone } from 'lucide-react'
import { RnrClient } from '@/components/interior/rnr-client'

export const dynamic = 'force-dynamic'

export default async function RNRPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: rnrLeads } = await supabase
    .from('leads').select('*')
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'rnr')
    .order('created_at', { ascending: false })

  const leads = rnrLeads ?? []
  const count = leads.length

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">RNR</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">
            <span className="font-bold text-[#1C1712]">{count}</span> leads — Ring No Response
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <Phone className="w-4 h-4" />RNR Stage
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total RNR',     value: count,                                              color: '#DC2626' },
          { label: 'With Budget',   value: leads.filter((l: any) => l.budget).length,          color: '#B8860B' },
          { label: 'High Interest', value: leads.filter((l: any) => l.interest === 'High').length, color: '#059669' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {count > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <Phone className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700">{count} leads not responding — retry calling them!</p>
        </div>
      )}

      <RnrClient leads={leads} count={count} />
    </div>
  )
}