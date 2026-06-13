import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { CreateInvoiceButton } from '@/components/billing/create-invoice-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, string> = {
  draft:   'bg-[#F0EBE0] text-[#7A6E60]',
  sent:    'bg-blue-50 text-blue-700',
  paid:    'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-600',
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
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1712]">Invoices</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">
            <span className="text-[#B8860B] font-semibold">{count ?? 0}</span> total invoices
          </p>
        </div>
        <CreateInvoiceButton companyId={profile.company_id} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: `₹${(summary.total / 1000).toFixed(1)}K`, color: 'text-[#1C1712]', bg: 'bg-[#FDFAF4]' },
          { label: 'Collected',    value: `₹${(summary.collected / 1000).toFixed(1)}K`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue',      value: `₹${(summary.overdue / 1000).toFixed(1)}K`, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-2xl p-4`}>
            <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-serif ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <a href="/billing/invoices"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !params?.status ? 'bg-[#1C1712] text-white' : 'bg-[#F0EBE0] text-[#7A6E60] hover:bg-[#E8E0D0]'
          }`}>
          All
        </a>
        {statuses.map((s) => (
          <a key={s} href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              params?.status === s ? 'bg-[#1C1712] text-white' : 'bg-[#F0EBE0] text-[#7A6E60] hover:bg-[#E8E0D0]'
            }`}>
            {s}
          </a>
        ))}
      </div>

      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2D9C8] text-left">
              {['Invoice', 'Customer', 'Amount', 'Paid', 'Status', 'Due Date'].map(h => (
                <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(invoices ?? []).map((inv: any) => (
              <tr key={inv.id} className="hover:bg-[#F5F0E8] transition-colors cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B8860B]" />
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
                <td className="px-5 py-3.5 text-sm text-emerald-600 font-medium">
                  ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusStyle[inv.status] ?? statusStyle.draft}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))}
            {!invoices?.length && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-[#7A6E60]" />
                  </div>
                  <p className="text-[#7A6E60] text-sm font-medium">No invoices found</p>
                  <p className="text-[#B8A99A] text-xs mt-1">Click "+ Create Invoice" to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}