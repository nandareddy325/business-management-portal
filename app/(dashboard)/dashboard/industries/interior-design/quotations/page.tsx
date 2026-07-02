import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { QuotationsClient } from '@/components/interior/quotations-client'

export const dynamic = 'force-dynamic'

export default async function QuotationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: leads, count } = await supabase
    .from('leads').select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('industry', 'interior-design')
    .eq('pipeline_stage', 'quotation')
    .order('created_at', { ascending: false })

  const totalBudget = leads?.reduce((s, l: any) => s + Number(l.budget || 0), 0) ?? 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Interior Design · Pipeline</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Quotations</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5"><span className="font-bold text-[#1C1712]">{count ?? 0}</span> leads</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8' }}>
          <FileText className="w-4 h-4" />Quotation Stage
        </div>
      </div>
      <QuotationsClient leads={leads ?? []} count={count ?? 0} totalBudget={totalBudget} />
    </div>
  )
}