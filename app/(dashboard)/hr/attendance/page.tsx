import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { MarkAttendanceButton } from '@/components/hr/mark-attendance-button'
import { DatePicker } from '@/components/hr/date-picker'
import { AttendanceStatusDropdown } from '@/components/hr/attendance-status-dropdown'

export const dynamic = 'force-dynamic'

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  present:  { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Present' },
  absent:   { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Absent' },
  half_day: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Half Day' },
  leave:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Leave' },
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<any>
}) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const today = params?.date ?? new Date().toISOString().split('T')[0]
  const displayDate = new Date(today).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const [{ data: employees }, { data: attendance }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, full_name, designation, department')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('attendance')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('attendance_date', today),
  ])

  const attendanceMap = Object.fromEntries(
    (attendance ?? []).map((a: any) => [a.employee_id, a])
  )

  const totalCount    = employees?.length ?? 0
  const markedCount   = attendance?.length ?? 0
  const presentCount  = attendance?.filter((a: any) => a.status === 'present').length ?? 0
  const absentCount   = attendance?.filter((a: any) => a.status === 'absent').length ?? 0
  const leaveCount    = attendance?.filter((a: any) => ['half_day', 'leave'].includes(a.status)).length ?? 0
  const unmarkedCount = totalCount - markedCount

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1C1712]">Attendance</h1>
          <p className="text-sm text-[#7A6E60] mt-0.5">{displayDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker defaultValue={today} />
          <MarkAttendanceButton
            companyId={profile.company_id}
            date={today}
            employees={employees ?? []}
            attendanceMap={attendanceMap}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Staff', value: totalCount,   bg: 'bg-[#FDFAF4]',  text: 'text-[#1C1712]',   icon: '👥' },
          { label: 'Present',     value: presentCount, bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✅' },
          { label: 'Absent',      value: absentCount,  bg: 'bg-red-50',     text: 'text-red-600',     icon: '❌' },
          { label: 'Leave/Half',  value: leaveCount,   bg: 'bg-amber-50',   text: 'text-amber-700',   icon: '🕐' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-[#E2D9C8] rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <p className="text-xs text-[#7A6E60] font-medium">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold font-serif ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#7A6E60]">Attendance marked</p>
            <p className="text-xs font-bold text-[#1C1712]">{markedCount}/{totalCount}</p>
          </div>
          <div className="h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (markedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          {unmarkedCount > 0 && (
            <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ {unmarkedCount} employees not marked yet</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2D9C8] text-left">
              {['Employee', 'Department', 'Designation', 'Status', 'Check In', 'Notes'].map(h => (
                <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[#7A6E60] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {(employees ?? []).map((emp: any) => {
              const rec = attendanceMap[emp.id]
              const style = rec ? statusStyle[rec.status] : null
              return (
                <tr key={emp.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0EBE0] rounded-xl flex items-center justify-center text-xs font-bold text-[#7A6E60] flex-shrink-0">
                        {emp.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <p className="text-sm font-semibold text-[#1C1712]">{emp.full_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {emp.department
                      ? <span className="text-xs bg-[#F0EBE0] text-[#7A6E60] px-2 py-0.5 rounded-md font-medium">{emp.department}</span>
                      : <span className="text-[#B8A99A]">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#7A6E60]">{emp.designation ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <AttendanceStatusDropdown
  employeeId={emp.id}
  companyId={profile.company_id}
  date={today}
  currentStatus={rec?.status ?? null}
  recordId={rec?.id ?? null}   
/>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60]">
                    {rec?.check_in
                      ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#7A6E60] max-w-[160px] truncate">
                    {rec?.notes ?? '—'}
                  </td>
                </tr>
              )
            })}
            {!employees?.length && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="w-12 h-12 bg-[#F0EBE0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-[#7A6E60]" />
                  </div>
                  <p className="text-[#7A6E60] text-sm font-medium">No employees found</p>
                  <p className="text-[#B8A99A] text-xs mt-1">Add employees in HRMS first</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}