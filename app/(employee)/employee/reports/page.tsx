import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Folder, MessageSquare } from 'lucide-react'
import { SubmitReportButton } from '@/components/employee/submit-report-button'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, string> = {
  completed:   'text-emerald-700',
  in_progress: 'text-blue-700',
  pending:     'text-amber-700',
}

interface Report {
  id: string
  status?: string
  report_date: string
  task_description?: string
  project_name?: string
  hours_spent?: number | string
  manager_comment?: string
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
    supabase.from('work_reports').select('*').eq('employee_id', employee.id).eq('report_date', today).maybeSingle(),
    supabase.from('work_reports').select('*').eq('employee_id', employee.id)
      .order('report_date', { ascending: false }).limit(30),
  ])

  const mono = { fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }
  const serif = { fontFamily: 'Georgia, serif' }

  return (
    <div className="min-h-screen bg-[#EFE9DD]">
      <div className="max-w-3xl mx-auto py-4 px-3 lg:py-6 lg:px-6">

        <div className="relative border border-[#B8860B]/35">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#B8860B] pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#B8860B] pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#B8860B] pointer-events-none z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#B8860B] pointer-events-none z-10" />

          {/* Hero */}
          <div className="bg-[#1C1712] px-6 py-5 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05]" style={{
              backgroundImage: 'linear-gradient(#B8860B 1px, transparent 1px), linear-gradient(90deg, #B8860B 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }} />
            <div className="relative">
              <Link href="/employee" className="text-white/40 text-[10px] tracking-[1.5px] uppercase flex items-center gap-1.5 mb-3 w-fit hover:text-[#D4A537] transition-colors" style={mono}>
                <ArrowLeft className="w-3 h-3" /> Back to portal
              </Link>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-[24px] text-white italic" style={{ fontFamily: 'Georgia, serif', fontWeight: 500 }}>Work Reports</h1>
                  <p className="text-[11px] text-white/40 mt-1 tracking-wide" style={mono}>DAILY TASK SUBMISSIONS</p>
                </div>
                {!todayReport && (
                  <SubmitReportButton employeeId={employee.id} companyId={employee.company_id} />
                )}
              </div>
            </div>
          </div>

          {/* §1 — Today's report */}
          {todayReport && (
            <div className="bg-emerald-50/40 border-t border-[#B8860B]/25 px-6 py-4 lg:px-8">
              <p className="text-[9px] tracking-[3px] text-emerald-700 font-semibold mb-3 uppercase" style={mono}>§1 — Today&apos;s Submission</p>
              <p className="text-[15px] text-[#1C1712] mb-2" style={serif}>{todayReport.task_description}</p>
              {(todayReport.project_name || todayReport.hours_spent) && (
                <div className="flex items-center gap-4 text-[11px] text-emerald-700 mb-2">
                  {todayReport.project_name && (
                    <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> {todayReport.project_name}</span>
                  )}
                  {todayReport.hours_spent && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {todayReport.hours_spent}h spent</span>
                  )}
                </div>
              )}
              {todayReport.manager_comment && (
                <div className="border-l-2 border-blue-400 pl-3 py-1 mt-2 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-700">{todayReport.manager_comment}</p>
                </div>
              )}
            </div>
          )}

          {/* §2 — Recent reports */}
          <div className="bg-white border-t border-[#B8860B]/25">
            <div className="flex items-center justify-between px-6 lg:px-8 pt-4 pb-1.5">
              <p className="text-[9px] tracking-[3px] text-[#8B6914] font-semibold uppercase" style={mono}>
                §{todayReport ? '2' : '1'} — Recent Reports
              </p>
              <p className="text-[10px] text-[#9A8F82]">{reports?.length ?? 0} records</p>
            </div>

            <div>
              {(reports as Report[] ?? []).map((r, idx) => {
                const color = statusStyle[r.status] ?? 'text-[#9A8F82]'
                return (
                  <div key={r.id} className={`px-6 lg:px-8 py-3.5 ${idx > 0 ? 'border-t border-[#F0EAE0]' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] text-[#9A8F82] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <span className={`text-[11px] font-medium capitalize ${color}`}>{r.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[14px] text-[#1C1712] mb-1.5" style={serif}>{r.task_description}</p>
                    {(r.project_name || r.hours_spent) && (
                      <div className="flex items-center gap-4 text-[11px] text-[#9A8F82]">
                        {r.project_name && (
                          <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> {r.project_name}</span>
                        )}
                        {r.hours_spent && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.hours_spent}h</span>
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
                <div className="py-10 text-center px-6">
                  <p className="text-[#9A8F82] text-sm">No reports submitted yet</p>
                  <p className="text-[#B8B0A0] text-xs mt-1">Submit your first report above</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}