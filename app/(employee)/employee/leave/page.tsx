import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplyLeaveButton } from '@/components/employee/apply-leave-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; text: string }> = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected: { bg: 'bg-red-50',     text: 'text-red-600' },
}

export default async function EmployeeLeavePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees').select('id, full_name, company_id').eq('email', user.email!).single()
  if (!employee) redirect('/login')

  const [{ data: balance }, { data: applications }] = await Promise.all([
    supabase.from('leave_balances').select('*').eq('employee_id', employee.id).eq('year', new Date().getFullYear()).single(),
    supabase.from('leave_applications').select('*').eq('employee_id', employee.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <div className="bg-[#1C1712] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <a href="/employee" className="text-white/40 text-xs">← Back</a>
            <h1 className="text-white text-lg font-semibold mt-1">Leave Management</h1>
          </div>
          <ApplyLeaveButton employeeId={employee.id} companyId={employee.company_id} balance={balance} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Balance */}
        {balance && (
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-3">Leave Balance {new Date().getFullYear()}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'Casual Leave', short: 'CL', total: balance.cl_total, used: balance.cl_used, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'Sick Leave',   short: 'SL', total: balance.sl_total, used: balance.sl_used, color: 'text-amber-600', bg: 'bg-amber-50' },
                { type: 'Earned Leave', short: 'EL', total: balance.el_total, used: balance.el_used, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(l => (
                <div key={l.short} className={`${l.bg} rounded-xl p-3`}>
                  <p className="text-[9px] text-[#7A6E60] font-medium">{l.type}</p>
                  <p className={`text-2xl font-bold ${l.color} mt-0.5`}>{l.total - l.used}</p>
                  <p className="text-[9px] text-[#9A8F82]">Available</p>
                  <div className="h-1 bg-white/50 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-current opacity-40" style={{ width: `${(l.used / l.total) * 100}%` }} />
                  </div>
                  <p className="text-[9px] text-[#9A8F82] mt-0.5">{l.used}/{l.total} used</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-sm font-semibold text-[#1C1712]">Leave History</p>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {(applications ?? []).map((a: any) => {
              const style = statusStyle[a.status]
              return (
                <div key={a.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#B8860B]">{a.leave_type}</span>
                      <span className="text-xs text-[#7A6E60]">·</span>
                      <span className="text-xs text-[#7A6E60]">{a.days} day{a.days > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-medium text-[#1C1712]">
                      {new Date(a.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {a.from_date !== a.to_date && ` – ${new Date(a.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                    {a.reason && <p className="text-xs text-[#9A8F82] mt-0.5 truncate max-w-[200px]">{a.reason}</p>}
                    {a.manager_comment && <p className="text-xs text-blue-600 mt-0.5">💬 {a.manager_comment}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${style.bg} ${style.text}`}>
                    {a.status}
                  </span>
                </div>
              )
            })}
            {!applications?.length && (
              <div className="py-12 text-center">
                <p className="text-[#9A8F82] text-sm">No leave applications yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}