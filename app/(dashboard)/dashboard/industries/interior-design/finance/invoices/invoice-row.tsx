'use client'

import { useRouter } from 'next/navigation'

const statusBadge: Record<string, string> = {
  paid:    'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-600',
  draft:   'bg-[#F5F0E8] text-[#9A8F82]',
  sent:    'bg-blue-100 text-blue-700',
}

export function InvoiceRow({ inv }: { inv: any }) {
  const router = useRouter()

  return (
    <tr
      onClick={() => router.push(`/dashboard/industries/interior-design/finance/invoices/${inv.id}`)}
      className="hover:bg-[#FFFBEF] transition-colors cursor-pointer"
    >
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-[#1C1712]">{inv.invoice_no}</p>
        {inv.notes && <p className="text-xs text-[#9A8F82] truncate max-w-xs">{inv.notes}</p>}
      </td>
      <td className="px-5 py-3 text-sm font-bold text-[#1C1712]">
        ₹{Number(inv.amount).toLocaleString('en-IN')}
      </td>
      <td className="px-5 py-3 text-sm font-semibold text-emerald-600">
        ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
      </td>
      <td className="px-5 py-3 text-xs text-[#9A8F82]">
        {inv.due_date
          ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-5 py-3">
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusBadge[inv.status] ?? statusBadge.draft}`}>
          {inv.status ?? 'draft'}
        </span>
      </td>
      <td className="px-5 py-3 text-xs text-[#9A8F82]">
        {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </td>
    </tr>
  )
}