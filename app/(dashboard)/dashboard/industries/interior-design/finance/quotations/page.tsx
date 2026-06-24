import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

const statusBadge: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  sent:     'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  draft:    'bg-[#F5F0E8] text-[#9A8F82]',
}

export default async function QuotationsFinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  // ✅ id_clients table use cheyyi
  const { data: quotations } = await supabase
    .from('quotations')
    .select('*, client:id_clients(name)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const all = quotations ?? []
  const totalValue    = all.reduce((s, q) => s + Number(q.amount || 0), 0)
  const countApproved = all.filter(q => q.status === 'approved').length
  const countPending  = all.filter(q => q.status === 'pending' || q.status === 'sent').length
  const countRejected = all.filter(q => q.status === 'rejected').length

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">Quotations</h1>
          <p className="text-sm text-[#9A8F82] mt-1">{all.length} total quotations</p>
        </div>
        <a href="/dashboard/industries/interior-design/finance/quotations/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1C1712' }}>
          <Plus size={15} /> New Quotation
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Value',    value: `₹${totalValue.toLocaleString('en-IN')}`, icon: FileText,     color: 'text-[#B8860B]',    bg: 'bg-amber-50',   border: 'border-amber-100' },
          { label: 'Approved',       value: countApproved,                              icon: CheckCircle,  color: 'text-emerald-600',  bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending / Sent', value: countPending,                               icon: Clock,        color: 'text-blue-600',     bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Rejected',       value: countRejected,                              icon: XCircle,      color: 'text-red-500',      bg: 'bg-red-50',     border: 'border-red-100' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-4 shadow-sm`}>
              <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={15} className={card.color} />
              </div>
              <p className="font-serif text-xl font-bold text-[#1C1712]">{card.value}</p>
              <p className="text-xs text-[#9A8F82] mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">All Quotations</h2>
        </div>
        {all.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-[#9A8F82]" />
            </div>
            <p className="text-sm font-semibold text-[#1C1712]">No quotations yet</p>
            <p className="text-xs text-[#9A8F82] mt-1">Create your first quotation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EBE0] bg-[#FDFAF8] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Quotation No</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {all.map((q: any) => (
                  <tr key={q.id} className="hover:bg-[#FFFBEF] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-[#1C1712]">{q.quotation_no}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#9A8F82]">{q.client?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#1C1712]">₹{Number(q.amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusBadge[q.status] ?? statusBadge.draft}`}>
                        {q.status ?? 'draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#9A8F82]">
                      {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}