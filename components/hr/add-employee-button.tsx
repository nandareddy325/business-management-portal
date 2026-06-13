'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Copy, Check } from 'lucide-react'

export function AddEmployeeButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ email: string; password: string; empCode: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', designation: '',
    department: '', join_date: '', salary: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setError('Full name required'); return }
    if (!form.email.trim()) { setError('Email required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/hr/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create employee')
      setCreated(data.employee)
      setForm({ full_name: '', email: '', phone: '', designation: '', department: '', join_date: '', salary: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!created) return
    navigator.clipboard.writeText(
      `Employee ID: ${created.empCode}\nEmail: ${created.email}\nPassword: ${created.password}\nLogin: ${window.location.origin}/login`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    setCreated(null)
    setError('')
    router.refresh()
  }

  const DEPARTMENTS = ['Design', 'Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations', 'Support']

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Employee
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1C1712]">Add Employee</h2>
              <button onClick={handleClose}><X className="w-5 h-5 text-[#9A8F82]" /></button>
            </div>

            {created ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
                  <p className="text-sm font-bold text-emerald-700">Employee Created Successfully!</p>
                  <p className="text-xs text-emerald-600 mt-1">Share these login credentials with the employee</p>
                </div>
                <div className="bg-[#F5F0E8] border border-[#DDD5C4] rounded-xl p-4 space-y-3">
                  {[
                    { label: 'Employee ID', value: created.empCode },
                    { label: 'Login Email', value: created.email },
                    { label: 'Password', value: created.password },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-[#7A6E60] font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-[#1C1712] font-mono">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2D9C8]">
                    <span className="text-xs text-[#7A6E60] font-medium">Login URL</span>
                    <span className="text-xs text-[#B8860B] font-medium">/login</span>
                  </div>
                </div>
                <button onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#DDD5C4] text-sm font-medium text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
                  {copied ? <><Check className="w-4 h-4 text-emerald-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All Credentials</>}
                </button>
                <button onClick={handleClose}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Full Name *</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange}
                    placeholder="e.g. Ravi Kumar"
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Email * <span className="text-[#9A8F82]">(login email)</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="ravi@company.com"
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Join Date</label>
                    <input name="join_date" type="date" value={form.join_date} onChange={handleChange}
                      className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Designation</label>
                    <input name="designation" value={form.designation} onChange={handleChange}
                      placeholder="e.g. Designer"
                      className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Department</label>
                    <select name="department" value={form.department} onChange={handleChange}
                      className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]">
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#7A6E60] mb-1 block font-medium">Salary (₹/month)</label>
                  <input name="salary" type="number" value={form.salary} onChange={handleChange}
                    placeholder="25000"
                    className="w-full bg-white border border-[#DDD5C4] rounded-xl px-3 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B]" />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700">
                  💡 Login credentials auto-generate అవుతాయి — copy చేసి employee కి share చేయండి
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={handleClose}
                    className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8]">Cancel</button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 py-2.5 rounded-xl text-sm font-semibold">
                    {loading ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}