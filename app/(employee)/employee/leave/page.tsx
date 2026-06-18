import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
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
    .from('employees')
    .select('id, full_name, company_id')
    .eq('email', user.email!)
    .single()
  if (!employee) redirect('/login')

  const [{ data: balance }, { data: applications }] = await Promise.all([
    supabase.from('leave_balances').select('*').eq('employee_id', employee.id).eq('year', new Date().getFullYear()).single(),
    supabase.from('leave_applications').select('*').eq('employee_id', employee.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Hero */}
      <div className="bg-[#1C1712] px-6 py-5 relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-32 h-32 rounded-full border border-[#B8860B]/10" />
        <div className="max-w-lg mx-auto">
          <Link href="/employee" className="text-white/35 text-[11px] flex items-center gap-1 mb-2 w-fit hover:text-white/60 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to portal
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-white">Leave management</h1>
              <p className="text-[12px] text-white/30 mt-0.5">Track and apply for leaves</p>
            </div>
            <ApplyLeaveButton employeeId={employee.id} companyId={employee.company_id} balance={balance} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5">

        {/* Leave Balance */}
        {balance && (
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium mb-3 uppercase">
              Leave Balance {new Date().getFullYear()}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  type: 'CL', full: 'Casual leave',
                  total: balance.cl_total, used: balance.cl_used,
                  num: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
                  label: 'text-blue-700', prog: 'bg-blue-500',
                },
                {
                  type: 'SL', full: 'Sick leave',
                  total: balance.sl_total, used: balance.sl_used,
                  num: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
                  label: 'text-amber-700', prog: 'bg-amber-500',
                },
                {
                  type: 'EL', full: 'Earned leave',
                  total: balance.el_total, used: balance.el_used,
                  num: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
                  label: 'text-emerald-700', prog: 'bg-emerald-500',
                },
              ].map(l => (
                <div key={l.type} className={`${l.bg} border ${l.border} rounded-xl p-3`}>
                  <p className={`text-[9px] tracking-[1.5px] font-medium mb-0.5 ${l.label}`}>{l.type}</p>
                  <p className="text-[10px] text-[#7A6E60] mb-2">{l.full}</p>
                  <p className={`text-[28px] font-medium leading-none ${l.num}`}>{l.total - l.used}</p>
                  <p className="text-[10px] text-[#7A6E60] mt-1 mb-2">available</p>
                  <div className="h-[3px] bg-black/5 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${l.prog}`}
                      style={{ width: `${l.total > 0 ? (l.used / l.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#9A8F82]">{l.used}/{l.total} used</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave History */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-[14px] font-medium text-[#1C1712]">Leave history</p>
            <p className="text-[12px] text-[#7A6E60]">{applications?.length ?? 0} applications</p>
          </div>

          <div className="divide-y divide-[#F0EBE0]">
            {(applications ?? []).map((a: any) => {
              const style = statusStyle[a.status] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
              return (
                <div key={a.id} className="px-4 py-3.5 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium text-[#B8860B] tracking-wide uppercase">{a.leave_type}</span>
                      <span className="text-[#D0C9BE] text-[10px]">·</span>
                      <span className="text-[10px] text-[#7A6E60]">{a.days} day{a.days > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1C1712]">
                      {new Date(a.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {a.from_date !== a.to_date && (
                        <> – {new Date(a.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                      )}
                      <span className="text-[#9A8F82] font-normal"> {new Date(a.from_date).getFullYear()}</span>
                    </p>
                    {a.reason && (
                      <p className="text-[11px] text-[#9A8F82] mt-0.5 truncate">{a.reason}</p>
                    )}
                    {a.manager_comment && (
                      <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                        💬 {a.manager_comment}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0 mt-0.5 ${style.bg} ${style.text}`}>
                    {a.status}
                  </span>
                </div>
              )
            })}

            {!applications?.length && (
              <div className="py-12 text-center">
                <p className="text-[#9A8F82] text-sm">No leave applications yet</p>
                <p className="text-[#B8B0A0] text-xs mt-1">Apply for your first leave above</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}