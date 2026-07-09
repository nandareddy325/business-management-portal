'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props { companyId: string }

export function CreateInvoiceButton({ companyId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    amount: '',
    due_date: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const generateInvoiceNo = () => {
    const now = new Date()
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`
  }

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) { setError('Customer name is required'); return }
    if (!form.amount || isNaN(Number(form.amount))) { setError('Valid amount is required'); return }

    setLoading(true)

    // 1. Create or find customer
    let customerId: string | null = null
    const { data: existing } = await supabase
      .from('crm_customers')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', form.customer_name.trim())
      .single()

    if (existing?.id) {
      customerId = existing.id
    } else {
      const { data: newCustomer } = await supabase
        .from('crm_customers')
        .insert({ company_id: companyId, name: form.customer_name.trim(), email: form.customer_email.trim() || null })
        .select('id')
        .single()
      customerId = newCustomer?.id ?? null
    }

    // 2. Create invoice
    const { error: err } = await supabase.from('invoices').insert({
      company_id: companyId,
      customer_id: customerId,
      invoice_no: generateInvoiceNo(),
      amount: Number(form.amount),
      paid_amount: 0,
      status: 'draft',
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
    })

    setLoading(false)

    if (err) { setError(err.message); return }

    setOpen(false)
    setForm({ customer_name: '', customer_email: '', amount: '', due_date: '', notes: '' })
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Invoice
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Create Invoice</h2>
              <button onClick={() => setOpen(false)} className="text-[#9A8F82] hover:text-[#1C1712] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Customer Name *</label>
                <input name="customer_name" value={form.customer_name} onChange={handleChange}
                  placeholder="e.g. Reddy Constructions"
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors" />
              </div>

              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Customer Email</label>
                <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange}
                  placeholder="customer@example.com"
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Amount (₹) *</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange}
                    placeholder="50000"
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Due Date</label>
                  <input name="due_date" type="date" value={form.due_date} onChange={handleChange}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Invoice notes or description..."
                  rows={2}
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] placeholder-[#C4BAB0] outline-none focus:border-[#B8860B] transition-colors resize-none" />
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
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}