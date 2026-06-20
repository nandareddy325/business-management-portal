import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, FileText, Clock, User, LayoutDashboard, ArrowRight, LogOut } from 'lucide-react'
import { AttendanceMarkButton } from '@/components/employee/attendance-mark-button'

export const dynamic = 'force-dynamic'

export default async function EmployeePortalPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let employee: any = null

  const { data: empByUserId } = await supabase
    .from('employees').select('*').eq('user_id', user.id).maybeSingle()

  if (empByUserId) {
    employee = empByUserId
  } else {
    const { data: empByEmail } = await supabase
      .from('employees').select('*').eq('email', user.email!).maybeSingle()
    if (empByEmail) {
      employee = empByEmail
      await supabase.from('employees').update({ user_id: user.id }).eq('id', empByEmail.id)
    }
  }

  if (!employee) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role === 'employee') {
      return (
        <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center px-4">
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-[#1C1712] mb-2">Employee Profile Not Found</h2>
            <p className="text-sm text-[#7A6E60] mb-4">Your account exists but employee profile is missing. Contact your admin.</p>
            <p className="text-xs text-[#9A8F82]">Email: {user.email}</p>
          </div>
        </div>
      )
    }
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: todayAttendance },
    { data: leaveBalance },
    { data: pendingLeaves },
    { data: todayReport },
  ] = await Promise.all([
    supabase.from('attendance').select('*').eq('employee_id', employee.id).eq('attendance_date', today).maybeSingle(),
    supabase.from('leave_balances').select('*').eq('employee_id', employee.id).eq('year', new Date().getFullYear()).maybeSingle(),
    supabase.from('leave_applications').select('*').eq('employee_id', employee.id).eq('status', 'pending'),
    supabase.from('work_reports').select('*').eq('employee_id', employee.id).eq('report_date', today).maybeSingle(),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const VALID_MODULES = ['pipeline', 'projects', 'hr', 'finance']
  const hasCRMAccess = Array.isArray(employee.permissions) &&
    employee.permissions.some((p: string) => VALID_MODULES.includes(p))

  const isCheckedIn  = !!(todayAttendance as any)?.check_in
  const isCheckedOut = !!(todayAttendance as any)?.check_out

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Hero */}
      <div className="bg-[#1C1712] px-6 py-7 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-[#B8860B]/10" />
        <div className="absolute right-5 top-5 w-24 h-24 rounded-full border border-[#B8860B]/8" />
        <div className="absolute right-16 top-14 w-2 h-2 rounded-full bg-[#B8860B] opacity-40" />
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] tracking-[3px] text-[#B8860B] font-medium mb-2 uppercase">Employee Portal</p>
          <h1 className="text-[22px] font-semibold text-white mb-1.5">
            {greeting}, {employee.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-white/30 tracking-wide">
            {employee.employee_code ?? employee.employee_id} · {employee.designation ?? 'Employee'} · {employee.department ?? '—'}
          </p>
          {todayAttendance && (
            <div className="inline-flex items-center gap-2 mt-3 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-[#B8860B] font-medium">
                Present today
                {(todayAttendance as any)?.check_in && (
                  <> · In: {new Date((todayAttendance as any).check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5 -mt-5">

        {/* ── ATTENDANCE MARK CARD ── */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
          <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium mb-3 uppercase">
            Mark Attendance
          </p>

          {/* Status indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-400' : 'bg-[#E2D9C8]'}`} />
              <span className="text-xs font-medium text-[#7A6E60]">
                Check In: {isCheckedIn
                  ? new Date((todayAttendance as any).check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </span>
            </div>
            <div className="w-px h-4 bg-[#E2D9C8]" />
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isCheckedOut ? 'bg-red-400' : 'bg-[#E2D9C8]'}`} />
              <span className="text-xs font-medium text-[#7A6E60]">
                Check Out: {isCheckedOut
                  ? new Date((todayAttendance as any).check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </span>
            </div>
          </div>

          {/* Mark Button — client component */}
          <AttendanceMarkButton
            employeeId={employee.id}
            isCheckedIn={isCheckedIn}
            isCheckedOut={isCheckedOut}
            attendanceId={(todayAttendance as any)?.id ?? null}
          />
        </div>

        {/* Today Status */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
          <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium mb-3 uppercase">
            Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl p-3.5 border ${todayAttendance ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F5F0E8] border-[#E2D9C8]'}`}>
              <p className="text-[11px] text-[#7A6E60] mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Attendance
              </p>
              <p className={`text-sm font-medium capitalize ${todayAttendance ? 'text-emerald-700' : 'text-[#9A8F82]'}`}>
                {todayAttendance ? (todayAttendance as any).status : 'Not marked'}
              </p>
              {(todayAttendance as any)?.check_in && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  In: {new Date((todayAttendance as any).check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className={`rounded-xl p-3.5 border ${todayReport ? 'bg-blue-50 border-blue-200' : 'bg-[#F5F0E8] border-[#E2D9C8]'}`}>
              <p className="text-[11px] text-[#7A6E60] mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Work report
              </p>
              <p className={`text-sm font-medium ${todayReport ? 'text-blue-700' : 'text-[#9A8F82]'}`}>
                {todayReport ? 'Submitted ✓' : 'Not submitted'}
              </p>
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        {leaveBalance && (
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <p className="text-[10px] tracking-[2px] text-[#7A6E60] font-medium mb-3 uppercase">
              Leave Balance {new Date().getFullYear()}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'CL', total: (leaveBalance as any).cl_total, used: (leaveBalance as any).cl_used, num: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'text-blue-700' },
                { type: 'SL', total: (leaveBalance as any).sl_total, used: (leaveBalance as any).sl_used, num: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'text-amber-700' },
                { type: 'EL', total: (leaveBalance as any).el_total, used: (leaveBalance as any).el_used, num: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'text-emerald-700' },
              ].map(l => (
                <div key={l.type} className={`${l.bg} border ${l.border} rounded-xl p-3.5 text-center`}>
                  <p className={`text-[10px] tracking-[1.5px] font-medium mb-1.5 ${l.label}`}>{l.type}</p>
                  <p className={`text-[26px] font-medium leading-none ${l.num}`}>{l.total - l.used}</p>
                  <p className="text-[11px] text-[#7A6E60] mt-1">{l.used}/{l.total} used</p>
                </div>
              ))}
            </div>
            {((pendingLeaves?.length) ?? 0) > 0 && (
              <p className="text-xs text-amber-700 mt-3 flex items-center gap-1.5 font-medium">
                <Clock className="w-3 h-3" /> {pendingLeaves?.length} leave(s) pending approval
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'My attendance', sub: 'View history',    icon: Clock,     href: '/employee/attendance', ic: 'bg-blue-50 text-blue-600' },
            { label: 'Apply leave',   sub: 'Request time off', icon: Calendar, href: '/employee/leave',      ic: 'bg-amber-50 text-amber-600' },
            { label: 'Work report',   sub: 'Submit today',    icon: FileText,  href: '/employee/reports',    ic: 'bg-emerald-50 text-emerald-600' },
            { label: 'My profile',    sub: 'View details',    icon: User,      href: '/employee/profile',    ic: 'bg-purple-50 text-purple-600' },
          ].map(a => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}
                className="bg-white border border-[#E2D9C8] rounded-2xl p-4 flex items-center gap-3 hover:border-[#B8860B]/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.ic}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#1C1712]">{a.label}</p>
                  <p className="text-[11px] text-[#7A6E60] mt-0.5">{a.sub}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* CRM Portal */}
        {hasCRMAccess && (
          <Link href="/dashboard"
            className="bg-[#1C1712] rounded-2xl p-4 flex items-center gap-3.5 hover:bg-[#2d2822] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/15 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-[#B8860B]" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-white">CRM Portal</p>
              <p className="text-[11px] text-white/35 mt-0.5">Go to business dashboard</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B8860B]/60" />
          </Link>
        )}

        {/* Logout */}
        <form action="/api/auth/signout" method="POST">
          <button type="submit"
            className="w-full py-3 rounded-xl border border-[#E2D9C8] text-sm text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </form>

      </div>
    </div>
  )
}