import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, FileText, Clock, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EmployeePortalPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ✅ Try user_id first, then email fallback
  let employee: any = null

  const { data: empByUserId } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (empByUserId) {
    employee = empByUserId
  } else {
    // Fallback: email తో try చేయి
    const { data: empByEmail } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email!)
      .maybeSingle()

    if (empByEmail) {
      employee = empByEmail

      // ✅ user_id update చేయి future కోసం
      await supabase
        .from('employees')
        .update({ user_id: user.id })
        .eq('id', empByEmail.id)
    }
  }

  // Employee record లేకపోతే — profile check చేయి
  if (!employee) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Employee role ఉంది కానీ employees table లో లేదు
    if (profile?.role === 'employee') {
      return (
        <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center px-4">
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-[#1C1712] mb-2">Employee Profile Not Found</h2>
            <p className="text-sm text-[#7A6E60] mb-4">
              Your account exists but employee profile is missing. Contact your admin.
            </p>
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

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Header */}
      <div className="bg-[#1C1712] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#B8860B] text-xs font-bold uppercase tracking-widest mb-1">Employee Portal</p>
          <h1 className="text-white text-xl font-semibold">
            {greeting}, {employee.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/40 text-xs mt-1">
            {employee.employee_code ?? employee.employee_id} · {employee.designation ?? 'Employee'} · {employee.department ?? '—'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Today Status */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-3">
            Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 ${todayAttendance ? 'bg-emerald-50 border border-emerald-200' : 'bg-[#F5F0E8] border border-[#E2D9C8]'}`}>
              <p className="text-[10px] text-[#7A6E60] font-medium">Attendance</p>
              <p className={`text-sm font-bold mt-0.5 capitalize ${todayAttendance ? 'text-emerald-700' : 'text-[#9A8F82]'}`}>
                {todayAttendance ? (todayAttendance as any).status : 'Not marked'}
              </p>
              {(todayAttendance as any)?.check_in && (
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  In: {new Date((todayAttendance as any).check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className={`rounded-xl p-3 ${todayReport ? 'bg-blue-50 border border-blue-200' : 'bg-[#F5F0E8] border border-[#E2D9C8]'}`}>
              <p className="text-[10px] text-[#7A6E60] font-medium">Work Report</p>
              <p className={`text-sm font-bold mt-0.5 ${todayReport ? 'text-blue-700' : 'text-[#9A8F82]'}`}>
                {todayReport ? 'Submitted ✓' : 'Not submitted'}
              </p>
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        {leaveBalance && (
          <div className="bg-white border border-[#E2D9C8] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-3">
              Leave Balance {new Date().getFullYear()}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'CL', total: (leaveBalance as any).cl_total, used: (leaveBalance as any).cl_used, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'SL', total: (leaveBalance as any).sl_total, used: (leaveBalance as any).sl_used, color: 'text-amber-600', bg: 'bg-amber-50' },
                { type: 'EL', total: (leaveBalance as any).el_total, used: (leaveBalance as any).el_used, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(l => (
                <div key={l.type} className={`${l.bg} rounded-xl p-3 text-center`}>
                  <p className="text-[10px] text-[#7A6E60] font-medium">{l.type}</p>
                  <p className={`text-xl font-bold ${l.color}`}>{l.total - l.used}</p>
                  <p className="text-[9px] text-[#9A8F82]">{l.used}/{l.total} used</p>
                </div>
              ))}
            </div>
            {((pendingLeaves?.length) ?? 0) > 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                ⏳ {pendingLeaves?.length} leave(s) pending approval
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'My Attendance', icon: Clock,    href: '/employee/attendance', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
            { label: 'Apply Leave',   icon: Calendar, href: '/employee/leave',      color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
            { label: 'Work Report',   icon: FileText, href: '/employee/reports',    color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'My Profile',    icon: User,     href: '/employee/profile',    color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
          ].map(a => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}
                className={`${a.bg} border ${a.border} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all`}>
                <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center border ${a.border}`}>
                  <Icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <p className="text-sm font-semibold text-[#1C1712]">{a.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <form action="/api/auth/signout" method="POST">
          <button type="submit"
            className="w-full py-3 rounded-xl border border-[#E2D9C8] text-sm text-[#7A6E60] hover:bg-[#F5F0E8] transition-colors">
            Logout
          </button>
        </form>

      </div>
    </div>
  )
}