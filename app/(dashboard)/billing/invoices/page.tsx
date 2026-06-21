import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { CreateInvoiceButton } from '@/components/billing/create-invoice-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; color: string }> = {
  draft:   { bg: '#F5F0E8', color: '#7A6E60' },
  sent:    { bg: '#EFF6FF', color: '#1D4ED8' },
  paid:    { bg: '#F0FDF4', color: '#166534' },
  partial: { bg: '#FFFBEB', color: '#B45309' },
  overdue: { bg: '#FEF2F2', color: '#DC2626' },
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
    .from('invoices').select('amount, paid_amount, status').eq('company_id', profile.company_id)

  const summary = (allInvoices ?? []).reduce(
    (acc, inv: any) => {
      acc.total += Number(inv.amount || 0)
      acc.collected += Number(inv.paid_amount || 0)
      if (inv.status === 'overdue') acc.overdue += Number(inv.amount || 0) - Number(inv.paid_amount || 0)
      return acc
    },
    { total: 0, collected: 0, overdue: 0 }
  )

  const statuses = ['draft', 'sent', 'paid', 'partial', 'overdue']

  return (
    <div className="space-y-5 p-4 md:p-0">

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
          { label: 'Total Billed', value: `₹${(summary.total / 1000).toFixed(1)}K`, color: '#1C1712', bg: '#FDFAF4' },
          { label: 'Collected',    value: `₹${(summary.collected / 1000).toFixed(1)}K`, color: '#166534', bg: '#F0FDF4' },
          { label: 'Overdue',      value: `₹${(summary.overdue / 1000).toFixed(1)}K`, color: '#DC2626', bg: '#FEF2F2' },
        ].map((s) => (
          <div key={s.label} className="border border-[#E2D9C8] rounded-2xl p-4"
            style={{ background: s.bg }}>
            <p className="text-[10px] text-[#7A6E60] font-semibold uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <a href="/billing/invoices"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={!params?.status
            ? { background: '#1C1712', color: '#B8860B' }
            : { background: '#F0EBE0', color: '#7A6E60' }
          }>
          All
        </a>
        {statuses.map((s) => (
          <a key={s} href={`?status=${s}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={params?.status === s
              ? { background: '#1C1712', color: '#B8860B' }
              : { background: '#F0EBE0', color: '#7A6E60' }
            }>
            {s}
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
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: '#B8860B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {(invoices ?? []).map((inv: any) => {
                const style = statusStyle[inv.status] ?? statusStyle.draft
                return (
                  <tr key={inv.id} className="hover:bg-[#FDFAF8] transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: '#B8860B' }} />
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
                    <td className="px-5 py-3.5 text-sm font-medium text-emerald-600">
                      ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize"
                        style={{ background: style.bg, color: style.color }}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE Cards */}
      {!!invoices?.length && (
        <div className="md:hidden space-y-3">
          {(invoices ?? []).map((inv: any) => {
            const style = statusStyle[inv.status] ?? statusStyle.draft
            return (
              <div key={inv.id} className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#F5F0E8' }}>
                      <FileText className="w-4 h-4" style={{ color: '#B8860B' }} />
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

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                    <p className="text-[10px] text-[#7A6E60] uppercase tracking-wide font-semibold">Amount</p>
                    <p className="text-sm font-bold text-[#1C1712] mt-0.5">
                      ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-[#BBF7D0]" style={{ background: '#F0FDF4' }}>
                    <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold">Paid</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background: '#FAFAF8' }}>
                    <p className="text-[10px] text-[#7A6E60] uppercase tracking-wide font-semibold">Due</p>
                    <p className="text-xs font-semibold text-[#1C1712] mt-0.5">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!invoices?.length && (
        <div className="bg-white border border-[#E2D9C8] rounded-2xl py-16 text-center">
          <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-[#7A6E60]" />
          </div>
          <p className="text-[#7A6E60] text-sm font-medium">No invoices found</p>
          <p className="text-[#B8A99A] text-xs mt-1">Click "+ Create Invoice" to get started</p>
        </div>
      )}
    </div>
  )
}