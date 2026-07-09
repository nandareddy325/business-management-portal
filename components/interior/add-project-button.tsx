'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AddProjectButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_name: '', client_name: '', budget: '', status: 'planning', start_date: '', deadline: '', notes: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('')
  }

  const handleSubmit = async () => {
    if (!form.project_name.trim()) { setError('Project name required'); return }
    if (!form.client_name.trim()) { setError('Client name required'); return }
    setLoading(true)
    const { error: err } = await supabase.from('projects').insert({
      company_id: companyId, industry: 'interior-design',
      project_name: form.project_name.trim(), client_name: form.client_name.trim(),
      budget: Number(form.budget) || 0, status: form.status,
      start_date: form.start_date || null, deadline: form.deadline || null, notes: form.notes || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ project_name: '', client_name: '', budget: '', status: 'planning', start_date: '', deadline: '', notes: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Project
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Add Project</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Project Name *</label>
                <input name="project_name" value={form.project_name} onChange={handleChange} placeholder="e.g. 3BHK Interior Redesign" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Client Name *</label>
                <input name="client_name" value={form.client_name} onChange={handleChange} placeholder="e.g. Ramesh Reddy" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Budget (₹)</label>
                  <input name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="500000" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Start Date</label>
                  <input name="start_date" type="date" value={form.start_date} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Deadline</label>
                  <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              </div>
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Project details..." className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] resize-none" /></div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}