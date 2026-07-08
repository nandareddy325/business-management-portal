'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Client {
  id: string
  client_name: string
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState('')

  const [form, setForm] = useState({
    invoice_no: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
    client_id: '',
    client_name: '',
    amount: '',
    paid_amount: '0',
    status: 'pending',
    due_date: '',
    notes: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('employees').select('company_id').eq('user_id', user.id).single()
      if (profile?.company_id) {
        setCompanyId(profile.company_id)
        const { data: clientList } = await supabase.from('clients').select('id, client_name').eq('company_id', profile.company_id).order('name')
        setClients(clientList ?? [])
      }
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!form.amount) { alert('Amount enter cheyyi!'); return }
    if (!form.client_id && !form.client_name) { alert('Client enter cheyyi!'); return }

    setLoading(true)
    try {
      const { error } = await supabase.from('invoices').insert({
        invoice_no: form.invoice_no,
        client_id: form.client_id || null,
        company_id: companyId,
        amount: Number(form.amount),
        paid_amount: Number(form.paid_amount || 0),
        status: form.status,
        due_date: form.due_date || null,
        notes: form.notes || null,
      })
      if (error) throw error
      router.push('/dashboard/industries/interior-design/finance/invoices')
    } catch (err: unknown) {
      alert('Error: ' + getErrorMessage(err, 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  const pending = Number(form.amount || 0) - Number(form.paid_amount || 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">

      <div>
        <a href="/dashboard/industries/interior-design/finance/invoices"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Invoices
        </a>
        <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Finance</p>
        <h1 className="font-serif text-2xl md:text-3xl text-[#1C1712]">New Invoice</h1>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">Invoice Details</h2>
        </div>
        <div className="p-6 space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Invoice Number</label>
              <input value={form.invoice_no} onChange={e => setForm(f => ({ ...f, invoice_no: e.target.value }))}
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Client *</label>
              {clients.length > 0 ? (
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]">
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
                </select>
              ) : (
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  placeholder="Client name type cheyyi"
                  className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Total Amount (₹) *</label>
              <input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Amount Paid (₹)</label>
              <input type="number" min="0" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]" />
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B]">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..."
              className="w-full bg-[#F7F5F1] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B] resize-none" />
          </div>

          {/* Summary */}
          {form.amount && (
            <div className="rounded-xl bg-[#F7F5F1] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9A8F82]">Total Amount</span>
                <span className="font-semibold text-[#1C1712]">₹{Number(form.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9A8F82]">Paid</span>
                <span className="font-semibold text-emerald-600">₹{Number(form.paid_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-[#E8E2D8] pt-2">
                <span className="text-[#1C1712]">Pending</span>
                <span className={pending > 0 ? 'text-amber-600' : 'text-emerald-600'}>₹{pending.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E2D8] text-[#9A8F82] hover:border-[#1C1712] hover:text-[#1C1712] transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: '#1C1712' }}>
          <Save size={15} />
          {loading ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>
    </div>
  )
}