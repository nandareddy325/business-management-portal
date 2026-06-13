'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Project { id: string; project_name: string }

export function AddDesignButton({ companyId, projects }: { companyId: string; projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ design_name: '', style: '', project_id: '', notes: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('')
  }

  const handleSubmit = async () => {
    if (!form.design_name.trim()) { setError('Design name required'); return }
    setLoading(true)
    const { error: err } = await supabase.from('id_designs').insert({
      company_id: companyId, design_name: form.design_name.trim(),
      style: form.style || null, project_id: form.project_id || null, notes: form.notes || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ design_name: '', style: '', project_id: '', notes: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Design
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Add Design</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Design Name *</label>
                <input name="design_name" value={form.design_name} onChange={handleChange} placeholder="e.g. Living Room Layout v2" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Style</label>
                  <select name="style" value={form.style} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    <option value="">Select...</option>
                    {['Modern','Contemporary','Classic','Minimalist','Traditional','Industrial'].map(s => <option key={s}>{s}</option>)}
                  </select></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Link Project</label>
                  <select name="project_id" value={form.project_id} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select></div>
              </div>
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange as any} rows={2} placeholder="Design notes..." className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] resize-none" /></div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Adding...' : 'Add Design'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}