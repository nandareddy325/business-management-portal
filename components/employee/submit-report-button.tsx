'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function SubmitReportButton({ employeeId, companyId }: { employeeId: string; companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ task_description: '', project_name: '', hours_spent: '8', status: 'completed' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.task_description.trim()) { setError('Task description required'); return }
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { error: err } = await supabase.from('work_reports').insert({
      employee_id: employeeId,
      company_id: companyId,
      report_date: today,
      task_description: form.task_description.trim(),
      project_name: form.project_name || null,
      hours_spent: Number(form.hours_spent) || 8,
      status: form.status,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm">
        <Plus className="w-4 h-4" /> Submit Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Today's Work Report</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Task Description *</label>
                <textarea name="task_description" value={form.task_description} onChange={handleChange as any} rows={3}
                  placeholder="What did you work on today?"
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Project</label>
                  <input name="project_name" value={form.project_name} onChange={handleChange}
                    placeholder="Project name" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Hours</label>
                  <input name="hours_spent" type="number" min="1" max="12" value={form.hours_spent} onChange={handleChange}
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}