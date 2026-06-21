import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IndianRupee, FileText } from 'lucide-react'
import { RecordPaymentButton } from '@/components/billing/record-payment-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; color: string }> = {
  paid:    { bg: '#F0FDF4', color: '#166534' },
  partial: { bg: '#FFFBEB', color: '#B45309' },
  overdue: { bg: '#FEF2F2', color: '#DC2626' },
  sent:    { bg: '#EFF6FF', color: '#1D4ED8' },
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

  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('*, customer:crm_customers(name, email)')
    .eq('company_id', profile.company_id)
    .in('status', ['sent', 'partial', 'overdue'])
    .order('created_at', { ascending: false })

  const totalCollected = invoices?.reduce((s, i) => s + Number(i.paid_amount || 0), 0) ?? 0
  const totalPending   = pendingInvoices?.reduce((s, i) => s + (Number(i.amount || 0) - Number(i.paid_amount || 0)), 0) ?? 0
  const totalOverdue   = pendingInvoices?.filter((i: any) => i.status === 'overdue').reduce((s, i) => s + (Number(i.amount || 0) - Number(i.paid_amount || 0)), 0) ?? 0

  return (
    <div className="space-y-5 p-4 md:p-0">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Finance</p>
          <h1 className="text-xl font-bold text-[#1C1712]">Payments</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">
            <span className="font-semibold" style={{ color: '#B8860B' }}>{invoices?.length ?? 0}</span> payments received
          </p>
        </div>
        <RecordPaymentButton companyId={profile.company_id} pendingInvoices={pendingInvoices ?? []} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Collected', value: `₹${(totalCollected / 1000).toFixed(1)}K`, color: '#166534', bg: '#F0FDF4', icon: '✅' },
          { label: 'Pending',   value: `₹${(totalPending / 1000).toFixed(1)}K`,   color: '#B45309', bg: '#FFFBEB', icon: '⏳' },
          { label: 'Overdue',   value: `₹${(totalOverdue / 1000).toFixed(1)}K`,   color: '#DC2626', bg: '#FEF2F2', icon: '⚠️' },
        ].map((s) => (
          <div key={s.label} className="border border-[#E2D9C8] rounded-2xl p-4" style={{ background: s.bg }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{s.icon}</span>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7A6E60]">{s.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Collections */}
      {(pendingInvoices?.length ?? 0) > 0 && (
        <div className="border border-amber-200 rounded-2xl overflow-hidden" style={{ background: '#FFFBEB' }}>
          <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-800">⏳ Pending Collections</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
              {pendingInvoices?.length}
            </span>
          </div>

          {/* Desktop pending */}
          <div className="hidden md:block divide-y divide-amber-100">
            {pendingInvoices?.map((inv: any) => {
              const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
              const style = statusStyle[inv.status] ?? statusStyle.sent
              return (
                <div key={inv.id} className="flex items-center justify-between bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1712]">{inv.customer?.name ?? '—'}</p>
                      <p className="text-xs text-[#7A6E60]">{inv.invoice_no}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: style.bg, color: style.color }}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile pending cards */}
          <div className="md:hidden p-3 space-y-2">
            {pendingInvoices?.map((inv: any) => {
              const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
              const style = statusStyle[inv.status] ?? statusStyle.sent
              return (
                <div key={inv.id} className="bg-white rounded-xl p-3 border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-[#1C1712]">{inv.customer?.name ?? '—'}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: style.bg, color: style.color }}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#7A6E60]">{inv.invoice_no}</p>
                    <p className="text-sm font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DESKTOP Payment History Table */}
      <div className="hidden md:block bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: '#1C1712' }}>
          <h3 className="text-sm font-semibold text-white">Payment History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
              {['Invoice', 'Customer', 'Total', 'Paid', 'Balance', 'Status', 'Date'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#7A6E60] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(invoices ?? []).map((inv: any) => {
              const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
              const style = statusStyle[inv.status] ?? statusStyle.paid
              return (
                <tr key={inv.id} className="hover:bg-[#FDFAF8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5" style={{ color: '#B8860B' }} />
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
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize"
                      style={{ background: style.bg, color: style.color }}>
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

      {/* MOBILE Payment History Cards */}
      {!!invoices?.length && (
        <div className="md:hidden space-y-3">
          <h3 className="text-sm font-bold text-[#1C1712] px-1">Payment History</h3>
          {(invoices ?? []).map((inv: any) => {
            const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
            const style = statusStyle[inv.status] ?? statusStyle.paid
            return (
              <div key={inv.id} className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F5F0E8' }}>
                      <IndianRupee className="w-4 h-4" style={{ color: '#B8860B' }} />
                    </div>
                    <div>
                      <p className="text-sm font-mono font-bold text-[#1C1712]">{inv.invoice_no}</p>
                      <p className="text-xs text-[#7A6E60]">{inv.customer?.name ?? '—'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize"
                    style={{ background: style.bg, color: style.color }}>
                    {inv.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                    <p className="text-[10px] text-[#7A6E60] uppercase tracking-wide font-semibold">Total</p>
                    <p className="text-sm font-bold text-[#1C1712] mt-0.5">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-[#BBF7D0]" style={{ background: '#F0FDF4' }}>
                    <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold">Paid</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                    <p className="text-[10px] text-[#7A6E60] uppercase tracking-wide font-semibold">Balance</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: balance > 0 ? '#DC2626' : '#166534' }}>
                      {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : 'Paid'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state mobile */}
      {!invoices?.length && (
        <div className="md:hidden bg-white border border-[#E2D9C8] rounded-2xl py-16 text-center">
          <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IndianRupee className="w-6 h-6 text-[#7A6E60]" />
          </div>
          <p className="text-[#7A6E60] text-sm font-medium">No payments recorded yet</p>
        </div>
      )}
    </div>
  )
}