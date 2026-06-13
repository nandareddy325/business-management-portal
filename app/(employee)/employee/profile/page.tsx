import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EmployeeProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/employee')

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <div className="bg-[#1C1712] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <a href="/employee" className="text-white/40 text-xs">← Back</a>
          <h1 className="text-white text-lg font-semibold mt-1">My Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Avatar + Name */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#F0EBE0] rounded-2xl flex items-center justify-center text-2xl font-bold text-[#B8860B] flex-shrink-0">
            {employee.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1C1712]">{employee.full_name}</h2>
            <p className="text-sm text-[#7A6E60]">{employee.designation} · {employee.department}</p>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">
              {employee.employee_code ?? employee.employee_id}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-4">Personal Information</p>
          <div className="space-y-3">
            {[
              { label: 'Full Name',    value: employee.full_name },
              { label: 'Email',        value: employee.email },
              { label: 'Phone',        value: employee.phone ?? '—' },
              { label: 'Department',   value: employee.department ?? '—' },
              { label: 'Designation',  value: employee.designation ?? '—' },
              { label: 'Join Date',    value: employee.join_date ? new Date(employee.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Status',       value: employee.is_active ? 'Active ✅' : 'Inactive' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F0EBE0] last:border-0">
                <span className="text-xs text-[#7A6E60] font-medium">{item.label}</span>
                <span className="text-sm font-semibold text-[#1C1712]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Salary */}
        {employee.salary && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Monthly Salary</p>
            <p className="text-lg font-bold text-amber-700">₹{Number(employee.salary).toLocaleString('en-IN')}</p>
          </div>
        )}

        <a href="/employee"
          className="block w-full text-center py-3 rounded-xl border border-[#E2D9C8] text-sm text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}