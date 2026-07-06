import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { InvoiceRow } from './invoice-row'

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Invoice fetch error:', error)
  }

  const all = invoices ?? []
  const totalAmount   = all.reduce((s, i) => s + Number(i.amount || 0), 0)
  const totalPaid     = all.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
  const totalPending  = totalAmount - totalPaid
  const countPaid     = all.filter(i => i.status === 'paid').length
  const countPending  = all.filter(i => i.status === 'pending').length
  const countOverdue  = all.filter(i => i.status === 'overdue').length

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">Invoices</h1>
          <p className="text-sm text-[#9A8F82] mt-1">{all.length} total invoices</p>
        </div>
        <a href="/dashboard/industries/interior-design/finance/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: '#1C1712' }}>
          <Plus size={15} /> New Invoice
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Invoiced', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Amount Received', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
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

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: `All (${all.length})`, key: 'all' },
          { label: `Paid (${countPaid})`, key: 'paid' },
          { label: `Pending (${countPending})`, key: 'pending' },
          { label: `Overdue (${countOverdue})`, key: 'overdue' },
        ].map(tab => (
          <span key={tab.key} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E8E2D8] text-[#1C1712]">
            {tab.label}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">All Invoices</h2>
        </div>
        {all.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-[#9A8F82]" />
            </div>
            <p className="text-sm font-semibold text-[#1C1712]">No invoices yet</p>
            <p className="text-xs text-[#9A8F82] mt-1">Create your first invoice</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EBE0] bg-[#FDFAF8] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Invoice No</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Paid</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Due Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {all.map((inv: any) => (
                  <InvoiceRow key={inv.id} inv={inv} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}