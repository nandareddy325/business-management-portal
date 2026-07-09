'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LeaveBalance {
  cl_total?: number
  cl_used?: number
  sl_total?: number
  sl_used?: number
  el_total?: number
  el_used?: number
  [key: string]: unknown
}

interface Props {
  employeeId: string
  companyId: string
  balance: LeaveBalance
}

export function ApplyLeaveButton({ employeeId, companyId, balance }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ leave_type: 'CL', from_date: '', to_date: '', reason: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const getDays = () => {
    if (!form.from_date || !form.to_date) return 0
    const from = new Date(form.from_date)
    const to = new Date(form.to_date)
    return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  const getAvailable = () => {
    if (!balance) return 0
    if (form.leave_type === 'CL') return balance.cl_total - balance.cl_used
    if (form.leave_type === 'SL') return balance.sl_total - balance.sl_used
    if (form.leave_type === 'EL') return balance.el_total - balance.el_used
    return 0
  }

  const handleSubmit = async () => {
    if (!form.from_date) { setError('From date required'); return }
    if (!form.to_date) { setError('To date required'); return }
    const days = getDays()
    if (days > getAvailable()) { setError(`Only ${getAvailable()} ${form.leave_type} days available`); return }

    setLoading(true)
    const { error: err } = await supabase.from('leave_applications').insert({
      employee_id: employeeId,
      company_id: companyId,
      leave_type: form.leave_type,
      from_date: form.from_date,
      to_date: form.to_date,
      days,
      reason: form.reason || null,
      status: 'pending',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ leave_type: 'CL', from_date: '', to_date: '', reason: '' })
    router.refresh()
  }

  const days = getDays()
  const available = getAvailable()

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm">
        <Plus className="w-4 h-4" /> Apply Leave
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Apply Leave</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Leave Type</label>
                <select name="leave_type" value={form.leave_type} onChange={handleChange}
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                  <option value="CL">Casual Leave (CL) — {(balance?.cl_total ?? 0) - (balance?.cl_used ?? 0)} available</option>
                  <option value="SL">Sick Leave (SL) — {(balance?.sl_total ?? 0) - (balance?.sl_used ?? 0)} available</option>
                  <option value="EL">Earned Leave (EL) — {(balance?.el_total ?? 0) - (balance?.el_used ?? 0)} available</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">From Date</label>
                  <input name="from_date" type="date" value={form.from_date} onChange={handleChange}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">To Date</label>
                  <input name="to_date" type="date" value={form.to_date} min={form.from_date} onChange={handleChange}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
              </div>
              {days > 0 && (
                <div className={`rounded-xl px-3 py-2 text-xs font-medium ${days > available ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {days} day{days > 1 ? 's' : ''} selected · {available} available
                </div>
              )}
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Reason</label>
                <textarea name="reason" value={form.reason} onChange={handleChange} rows={2}
                  placeholder="Brief reason for leave..."
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] resize-none" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || days > available}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Submitting...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}