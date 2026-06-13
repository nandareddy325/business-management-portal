import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubmitReportButton } from '@/components/employee/submit-report-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; text: string }> = {
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  in_progress: { bg: 'bg-blue-50',    text: 'text-blue-700' },
  pending:     { bg: 'bg-amber-50',   text: 'text-amber-700' },
}

export default async function EmployeeReportsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees').select('id, full_name, company_id').eq('email', user.email!).single()
  if (!employee) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: todayReport } = await supabase
    .from('work_reports').select('*').eq('employee_id', employee.id).eq('report_date', today).single()

  const { data: reports } = await supabase
    .from('work_reports').select('*').eq('employee_id', employee.id)
    .order('report_date', { ascending: false }).limit(30)

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <div className="bg-[#1C1712] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <a href="/employee" className="text-white/40 text-xs">← Back</a>
            <h1 className="text-white text-lg font-semibold mt-1">Work Reports</h1>
          </div>
          {!todayReport && (
            <SubmitReportButton employeeId={employee.id} companyId={employee.company_id} />
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {todayReport && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-2">✅ Today's Report Submitted</p>
            <p className="text-sm font-medium text-[#1C1712]">{todayReport.task_description}</p>
            {todayReport.project_name && <p className="text-xs text-[#7A6E60] mt-1">📁 {todayReport.project_name} · ⏱ {todayReport.hours_spent}h</p>}
            {todayReport.manager_comment && <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-3 py-2">💬 {todayReport.manager_comment}</p>}
          </div>
        )}

        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-sm font-semibold text-[#1C1712]">Recent Reports</p>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {(reports ?? []).map((r: any) => {
              const style = statusStyle[r.status]
              return (
                <div key={r.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs text-[#7A6E60]">
                      {new Date(r.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${style.bg} ${style.text}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-[#1C1712] font-medium">{r.task_description}</p>
                  {r.project_name && <p className="text-xs text-[#7A6E60] mt-0.5">📁 {r.project_name} · ⏱ {r.hours_spent}h</p>}
                  {r.manager_comment && <p className="text-xs text-blue-600 mt-1">💬 {r.manager_comment}</p>}
                </div>
              )
            })}
            {!reports?.length && (
              <div className="py-12 text-center">
                <p className="text-[#9A8F82] text-sm">No reports submitted yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}