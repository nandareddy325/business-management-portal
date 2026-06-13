'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Project { id: string; project_name: string }

export function AddMaterialButton({ companyId, projects }: { companyId: string; projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ material_name: '', category: '', quantity: '', unit: 'nos', unit_cost: '', supplier: '', project_id: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('')
  }

  const total = (Number(form.quantity)||0) * (Number(form.unit_cost)||0)

  const handleSubmit = async () => {
    if (!form.material_name.trim()) { setError('Material name required'); return }
    setLoading(true)
    const { error: err } = await supabase.from('id_materials').insert({
      company_id: companyId, material_name: form.material_name.trim(),
      category: form.category || null, quantity: Number(form.quantity)||0,
      unit: form.unit, unit_cost: Number(form.unit_cost)||0,
      supplier: form.supplier || null, project_id: form.project_id || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ material_name: '', category: '', quantity: '', unit: 'nos', unit_cost: '', supplier: '', project_id: '' })
    router.refresh()
  }

  const CATEGORIES = ['Flooring','Wall','Ceiling','Furniture','Lighting','Electrical','Plumbing','Paint','Hardware','Other']
  const UNITS = ['nos','sq.ft','sq.m','rft','kg','litre','box','set']

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Material
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Add Material</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Material Name *</label>
                <input name="material_name" value={form.material_name} onChange={handleChange} placeholder="e.g. Italian Marble Tiles" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Supplier</label>
                  <input name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier name" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Quantity</label>
                  <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="0" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Unit</label>
                  <select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select></div>
                <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Unit Cost (₹)</label>
                  <input name="unit_cost" type="number" value={form.unit_cost} onChange={handleChange} placeholder="0" className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" /></div>
              </div>
              {total > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 font-medium">
                  Total Cost: <span className="font-bold">₹{total.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div><label className="text-xs text-[#7A6E60] mb-1 block font-medium">Link Project</label>
                <select name="project_id" value={form.project_id} onChange={handleChange} className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                  <option value="">None</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select></div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                {loading ? 'Adding...' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}