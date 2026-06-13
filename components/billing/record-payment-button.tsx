'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Invoice {
  id: string
  invoice_no: string
  amount: number
  paid_amount: number
  customer?: { name: string }
}

interface Props {
  companyId: string
  pendingInvoices: Invoice[]
}

export function RecordPaymentButton({ companyId, pendingInvoices }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    notes: '',
  })

  const selectedInvoice = pendingInvoices.find(i => i.id === form.invoice_id)
  const balance = selectedInvoice
    ? Number(selectedInvoice.amount) - Number(selectedInvoice.paid_amount)
    : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.invoice_id) { setError('Select an invoice'); return }
    if (!form.amount || isNaN(Number(form.amount))) { setError('Valid amount required'); return }
    if (Number(form.amount) > balance) { setError(`Amount cannot exceed balance ₹${balance.toLocaleString('en-IN')}`); return }

    setLoading(true)

    const newPaid = Number(selectedInvoice!.paid_amount) + Number(form.amount)
    const newStatus = newPaid >= Number(selectedInvoice!.amount) ? 'paid' : 'partial'

    const { error: err } = await supabase
      .from('invoices')
      .update({ paid_amount: newPaid, status: newStatus })
      .eq('id', form.invoice_id)

    setLoading(false)
    if (err) { setError(err.message); return }

    setOpen(false)
    setForm({ invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], method: 'bank_transfer', notes: '' })
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Record Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Record Payment</h2>
              <button onClick={() => setOpen(false)} className="text-[#9A8F82] hover:text-[#1C1712] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Select Invoice *</label>
                <select name="invoice_id" value={form.invoice_id} onChange={handleChange}
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors">
                  <option value="">Choose invoice...</option>
                  {pendingInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_no} — {inv.customer?.name} (₹{(Number(inv.amount) - Number(inv.paid_amount)).toLocaleString('en-IN')} due)
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                  Balance due: <span className="font-bold">₹{balance.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Amount (₹) *</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange}
                    placeholder={balance ? String(balance) : '0'}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Payment Date</label>
                  <input name="payment_date" type="date" value={form.payment_date} onChange={handleChange}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Payment Method</label>
                <select name="method" value={form.method} onChange={handleChange}
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Transaction ID or reference..."
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors" />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)}
                className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8] transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {loading ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}