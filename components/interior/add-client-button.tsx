'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Project { id: string; project_name: string }

export function AddClientButton({ companyId, projects }: { companyId: string; projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', address: '', project_id: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('')
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Client name required'); return }
    setLoading(true)
    const { error: err } = await supabase.from('id_clients').insert({
      company_id: companyId, name: form.name.trim(),
      phone: form.phone || null, email: form.email || null,
      city: form.city || null, address: form.address || null,
      project_id: form.project_id || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ name: '', phone: '', email: '', city: '', address: '', project_id: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Client
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Add Client</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Reddy" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="client@email.com" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">City</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Hyderabad" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Link Project</label>
                  <select name="project_id" value={form.project_id} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select></div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}