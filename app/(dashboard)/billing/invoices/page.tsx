import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { CreateInvoiceButton } from '@/components/billing/create-invoice-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; color: string }> = {
  draft:   { bg: '#F5F0E8', color: '#7A6E60' },
  sent:    { bg: '#EFF6FF', color: '#1D4ED8' },
  paid:    { bg: '#F0FDF4', color: '#166534' },
  partial: { bg: '#FFFBEB', color: '#B45309' },
  overdue: { bg: '#FEF2F2', color: '#DC2626' },
}

const statusIcon: Record<string, string> = {
  draft: '📝', sent: '📤', paid: '✅', partial: '⏳', overdue: '⚠️'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<any>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const page = Number(params?.page ?? 1)
  const limit = 20

  let query = supabase
    .from('invoices')
    .select('*, customer:crm_customers(name, email)', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (params?.status) query = query.eq('status', params.status)

  const { data: invoices, count } = await query

  const { data: allInvoices } = await supabase
    .from('invoices').select('amount, paid_amount, status')
    .eq('company_id', profile.company_id)

  const summary = (allInvoices ?? []).reduce(
    (acc, inv: any) => {
      acc.total += Number(inv.amount || 0)
      acc.collected += Number(inv.paid_amount || 0)
      if (inv.status === 'overdue') acc.overdue += Number(inv.amount || 0) - Number(inv.paid_amount || 0)
      return acc
    },
    { total: 0, collected: 0, overdue: 0 }
  )

  const collectionPct = summary.total > 0
    ? Math.round((summary.collected / summary.total) * 100) : 0

  const statuses = ['draft', 'sent', 'paid', 'partial', 'overdue']

  return (
    <div className="space-y-4 p-4 md:p-0">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>Finance</p>
          <h1 className="text-xl font-bold text-[#1C1712]">Invoices</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">
            <span className="font-semibold" style={{ color: '#B8860B' }}>{count ?? 0}</span> total invoices
          </p>
        </div>
        <CreateInvoiceButton companyId={profile.company_id} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Billed', value: `₹${(summary.total / 1000).toFixed(1)}K`, color: '#1C1712', bg: '#FDFAF4', border: '#E2D9C8' },
          { label: 'Collected',    value: `₹${(summary.collected / 1000).toFixed(1)}K`, color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
          { label: 'Overdue',      value: `₹${(summary.overdue / 1000).toFixed(1)}K`,   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 border"
            style={{ background: s.bg, borderColor: s.border }}>
            <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Collection Progress Bar */}
      <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#1C1712]">Collection Progress</p>
          <p className="text-sm font-black" style={{ color: collectionPct >= 70 ? '#166534' : '#B45309' }}>
            {collectionPct}%
          </p>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0EBE0' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${collectionPct}%`,
              background: collectionPct >= 70 ? '#16A34A' : '#B45309'
            }}
          />
        </div>
        <p className="text-[10px] text-[#9A8F82] mt-1.5">
          ₹{summary.collected.toLocaleString('en-IN')} collected of ₹{summary.total.toLocaleString('en-IN')} total
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <a href="/billing/invoices"
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={!params?.status
            ? { background: '#1C1712', color: '#B8860B' }
            : { background: '#F0EBE0', color: '#7A6E60' }}>
          All
        </a>
        {statuses.map((s) => (
          <a key={s} href={`?status=${s}`}
            className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
            style={params?.status === s
              ? { background: '#1C1712', color: '#B8860B' }
              : { background: '#F0EBE0', color: '#7A6E60' }}>
            {statusIcon[s]} {s}
          </a>
        ))}
      </div>

      {/* DESKTOP Table */}
      {!!invoices?.length && (
        <div className="hidden md:block bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#1C1712' }}>
                {['Invoice', 'Customer', 'Amount', 'Paid', 'Status', 'Due Date'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: '#B8860B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {(invoices ?? []).map((inv: any) => {
                const st = statusStyle[inv.status] ?? statusStyle.draft
                const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
                return (
                  <tr key={inv.id} className="hover:bg-[#FDFAF8] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: '#F5F0E8' }}>
                          <FileText size={14} style={{ color: '#B8860B' }} />
                        </div>
                        <span className="text-sm font-mono font-bold text-[#1C1712]">{inv.invoice_no}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-[#1C1712]">{inv.customer?.name ?? '—'}</p>
                      <p className="text-xs text-[#7A6E60]">{inv.customer?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-[#1C1712]">
                      ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                      ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-bold capitalize"
                        style={{ background: st.bg, color: st.color }}>
                        {statusIcon[inv.status]} {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE Premium Cards */}
      {!!invoices?.length && (
        <div className="md:hidden space-y-3">
          {(invoices ?? []).map((inv: any) => {
            const st = statusStyle[inv.status] ?? statusStyle.draft
            const balance = Number(inv.amount || 0) - Number(inv.paid_amount || 0)
            const paidPct = Number(inv.amount || 0) > 0
              ? Math.round((Number(inv.paid_amount || 0) / Number(inv.amount || 0)) * 100)
              : 0

            return (
              <div key={inv.id} className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">

                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE0]"
                  style={{ background: '#FAFAF8' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#1C1712' }}>
                      <FileText size={14} style={{ color: '#B8860B' }} />
                    </div>
                    <div>
                      <p className="text-sm font-mono font-bold text-[#1C1712]">{inv.invoice_no}</p>
                      <p className="text-xs text-[#7A6E60]">{inv.customer?.name ?? '—'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold capitalize"
                    style={{ background: st.bg, color: st.color }}>
                    {statusIcon[inv.status]} {inv.status}
                  </span>
                </div>

                {/* Info grid */}
                <div className="p-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl px-3 py-2.5 border border-[#F0EBE0]"
                    style={{ background: '#FAFAF8' }}>
                    <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wider">Amount</p>
                    <p className="text-sm font-black text-[#1C1712] mt-0.5">
                      ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 border border-[#BBF7D0]"
                    style={{ background: '#F0FDF4' }}>
                    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Paid</p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">
                      ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 border border-[#F0EBE0]"
                    style={{ background: '#FAFAF8' }}>
                    <p className="text-[9px] font-bold text-[#7A6E60] uppercase tracking-wider">Due Date</p>
                    <p className="text-xs font-bold text-[#1C1712] mt-0.5">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {Number(inv.amount || 0) > 0 && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-[#7A6E60]">Payment Progress</p>
                      <p className="text-[10px] font-bold" style={{ color: paidPct === 100 ? '#166534' : '#B45309' }}>
                        {paidPct}%
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EBE0' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${paidPct}%`,
                          background: paidPct === 100 ? '#16A34A' : '#B8860B'
                        }}
                      />
                    </div>
                    {balance > 0 && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">
                        Balance: ₹{balance.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!invoices?.length && (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-16 text-center">
          <div className="w-14 h-14 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-[#B8860B]" />
          </div>
          <p className="text-[#1C1712] font-bold text-sm">No invoices found</p>
          <p className="text-[#B8A99A] text-xs mt-1">Click "+ Create Invoice" to get started</p>
        </div>
      )}
    </div>
  )
}