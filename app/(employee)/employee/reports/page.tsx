import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Folder, MessageSquare } from 'lucide-react'
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
    .from('employees')
    .select('id, full_name, company_id')
    .eq('email', user.email!)
    .single()
  if (!employee) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayReport }, { data: reports }] = await Promise.all([
    supabase.from('work_reports').select('*').eq('employee_id', employee.id).eq('report_date', today).single(),
    supabase.from('work_reports').select('*').eq('employee_id', employee.id)
      .order('report_date', { ascending: false }).limit(30),
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
              <h1 className="text-[20px] font-semibold text-white">Work reports</h1>
              <p className="text-[12px] text-white/30 mt-0.5">Daily task submissions</p>
            </div>
            {!todayReport && (
              <SubmitReportButton employeeId={employee.id} companyId={employee.company_id} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5">

        {/* Today's Report */}
        {todayReport && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-medium text-emerald-700">Today's report submitted</p>
            </div>
            <p className="text-[14px] font-medium text-emerald-900 mb-2">{todayReport.task_description}</p>
            {(todayReport.project_name || todayReport.hours_spent) && (
              <div className="flex items-center gap-4 text-[11px] text-emerald-700">
                {todayReport.project_name && (
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3" /> {todayReport.project_name}
                  </span>
                )}
                {todayReport.hours_spent && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {todayReport.hours_spent}h spent
                  </span>
                )}
              </div>
            )}
            {todayReport.manager_comment && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mt-3 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-blue-700">{todayReport.manager_comment}</p>
              </div>
            )}
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-[14px] font-medium text-[#1C1712]">Recent reports</p>
            <p className="text-[12px] text-[#7A6E60]">{reports?.length ?? 0} records</p>
          </div>

          <div className="divide-y divide-[#F0EBE0]">
            {(reports ?? []).map((r: any) => {
              const style = statusStyle[r.status] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
              return (
                <div key={r.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] text-[#7A6E60] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize ${style.bg} ${style.text}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-[#1C1712] mb-1.5">{r.task_description}</p>
                  {(r.project_name || r.hours_spent) && (
                    <div className="flex items-center gap-4 text-[11px] text-[#7A6E60]">
                      {r.project_name && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-3 h-3" /> {r.project_name}
                        </span>
                      )}
                      {r.hours_spent && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {r.hours_spent}h
                        </span>
                      )}
                    </div>
                  )}
                  {r.manager_comment && (
                    <p className="text-[11px] text-blue-600 mt-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> {r.manager_comment}
                    </p>
                  )}
                </div>
              )
            })}

            {!reports?.length && (
              <div className="py-12 text-center">
                <p className="text-[#9A8F82] text-sm">No reports submitted yet</p>
                <p className="text-[#B8B0A0] text-xs mt-1">Submit your first report above</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}