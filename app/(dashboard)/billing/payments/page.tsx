import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IndianRupee, FileText } from 'lucide-react'
import { RecordPaymentButton } from '@/components/billing/record-payment-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, string> = {
  paid:    'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
}

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:crm_customers(name, email)')
    .eq('company_id', profile.company_id)
    .in('status', ['paid', 'partial'])
    .order('created_at', { ascending: false })

  // All invoices for pending payments
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('*, customer:crm_customers(name, email)')
    .eq('company_id', profile.company_id)
    .in('status', ['sent', 'partial', 'overdue'])
    .order('created_at', { ascending: false })

  const totalCollected = invoices?.reduce((s, i) => s + Number(i.paid_amount || 0), 0) ?? 0
  const totalPending = pendingInvoices?.reduce((s, i) => s + (Number(i.amount || 0) - Number(i.paid_amount || 0)), 0) ?? 0
  const totalOverdue = pendingInvoices?.filter((i: any) => i.status === 'overdue').reduce((s, i) => s + (Number(i.amount || 0) - Number(i.paid_amount || 0)), 0) ?? 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1712]">Payments</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">
            <span className="text-[#B8860B] font-semibold">{invoices?.length ?? 0}</span> payments received
          </p>
        </div>
        <RecordPaymentButton companyId={profile.company_id} pendingInvoices={pendingInvoices ?? []} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: `₹${(totalCollected / 1000).toFixed(1)}K`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Pending',         value: `₹${(totalPending / 1000).toFixed(1)}K`,   color: 'text-amber-600',   bg: 'bg-amber-50',   icon: '⏳' },
          { label: 'Overdue',         value: `₹${(totalOverdue / 1000).toFixed(1)}K`,   color: 'text-red-500',     bg: 'bg-red-50',     icon: '⚠️' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            </div>
            <p className={`text-xl font-bold font-serif ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending payments */}
      {(pendingInvoices?.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">⏳ Pending Collections ({pendingInvoices?.length})</h3>
          <div className="space-y-2">
            {pendingInvoices?.map((inv: any) => {
              const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
              return (
                <div key={inv.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1712]">{inv.customer?.name ?? '—'}</p>
                      <p className="text-xs text-[#7A6E60]">{inv.invoice_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${inv.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payments received table */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2D9C8]">
          <h3 className="text-sm font-semibold text-[#1C1712]">Payment History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2D9C8] text-left">
              {['Invoice', 'Customer', 'Total Amount', 'Amount Paid', 'Balance', 'Status', 'Date'].map(h => (
                <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(invoices ?? []).map((inv: any) => {
              const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
              return (
                <tr key={inv.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span className="text-sm font-mono font-semibold text-[#1C1712]">{inv.invoice_no}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#1C1712]">{inv.customer?.name ?? '—'}</p>
                    <p className="text-xs text-[#7A6E60]">{inv.customer?.email ?? ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#1C1712]">
                    ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                    ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-red-500">
                    {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusStyle[inv.status] ?? statusStyle.paid}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              )
            })}
            {!invoices?.length && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <IndianRupee className="w-6 h-6 text-[#7A6E60]" />
                  </div>
                  <p className="text-[#7A6E60] text-sm font-medium">No payments recorded yet</p>
                  <p className="text-[#B8A99A] text-xs mt-1">Record a payment against an invoice to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}