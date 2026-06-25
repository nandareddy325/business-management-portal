'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewExpensePage() {
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const [form, setForm] = useState({
    expense_name: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.expense_name || !form.amount) {
      setError('Expense name and amount required.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase
      .from('employees')
      .select('company_id')
      .eq('user_id', user?.id)
      .single()

    const { error: insertError } = await supabase.from('expenses').insert({
      expense_name: form.expense_name,
      amount: Number(form.amount),
      category: form.category || null,
      expense_date: form.expense_date,
      notes: form.notes || null,
      company_id: emp?.company_id,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/industries/interior-design/finance/expenses')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#EDE8DE] transition-colors">
          <ArrowLeft size={15} className="text-[#1C1712]" />
        </button>
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B]">Finance</p>
          <h1 className="font-serif text-2xl text-[#1C1712]">New Expense</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
          <h2 className="font-serif text-base text-[#1C1712]">Expense Details</h2>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#9A8F82] uppercase tracking-wider mb-1.5 block">
              Expense Name <span className="text-red-400">*</span>
            </label>
            <input type="text" placeholder="e.g. Office Supplies"
              value={form.expense_name}
              onChange={e => setForm(f => ({ ...f, expense_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] placeholder:text-[#C5BFB5] focus:outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8F82] uppercase tracking-wider mb-1.5 block">
              Amount (₹) <span className="text-red-400">*</span>
            </label>
            <input type="number" placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] placeholder:text-[#C5BFB5] focus:outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8F82] uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B] transition-colors bg-white">
              <option value="">Select category</option>
              <option value="Materials">Materials</option>
              <option value="Labour">Labour</option>
              <option value="Transport">Transport</option>
              <option value="Utilities">Utilities</option>
              <option value="Software">Software</option>
              <option value="Marketing">Marketing</option>
              <option value="Rent">Rent</option>
              <option value="Salary">Salary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8F82] uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={form.expense_date}
              onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] focus:outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8F82] uppercase tracking-wider mb-1.5 block">Notes</label>
            <textarea rows={3} placeholder="Optional notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1C1712] placeholder:text-[#C5BFB5] focus:outline-none focus:border-[#B8860B] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#F0EBE0] bg-[#FDFAF8] flex justify-end gap-3">
          <button onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#9A8F82] hover:bg-[#F5F0E8] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{ background: '#1C1712' }}>
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
