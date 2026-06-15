import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { MarkAttendanceButton } from '@/components/hr/mark-attendance-button'
import { DatePicker } from '@/components/hr/date-picker'
import { AttendanceStatusDropdown } from '@/components/hr/attendance-status-dropdown'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  present:  { bg: '#F0FDF4', color: '#16A34A', label: 'Present',  icon: '✅' },
  absent:   { bg: '#FEF2F2', color: '#DC2626', label: 'Absent',   icon: '❌' },
  half_day: { bg: '#FFFBEB', color: '#D97706', label: 'Half Day', icon: '🕐' },
  leave:    { bg: '#EFF6FF', color: '#2563EB', label: 'Leave',    icon: '🏖️' },
}

const GRADIENTS = [
  ['#7C3AED', '#4F46E5'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#DB2777', '#BE185D'], ['#7C3AED', '#6D28D9'],
]

const ini = (name: string) => name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

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
  const attendancePct = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0
  const presentPct    = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="space-y-5 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color: '#B8860B' }}>HR & Admin</p>
          <h1 className="text-2xl font-bold text-[#1C1712]">Attendance</h1>
          <p className="text-sm text-[#9A8F82] mt-0.5">📅 {displayDate}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DatePicker defaultValue={today} />
          <MarkAttendanceButton
            companyId={profile.company_id}
            date={today}
            employees={employees ?? []}
            attendanceMap={attendanceMap}
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff', value: totalCount,   color: '#7C3AED', icon: '👥', bg: 'bg-white' },
          { label: 'Present',     value: presentCount, color: '#16A34A', icon: '✅', bg: 'bg-white' },
          { label: 'Absent',      value: absentCount,  color: '#DC2626', icon: '❌', bg: 'bg-white' },
          { label: 'Leave / Half',value: leaveCount,   color: '#D97706', icon: '🕐', bg: 'bg-white' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border border-[#E8E2D8] rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-[#9A8F82] uppercase tracking-wider">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            {s.label !== 'Total Staff' && totalCount > 0 && (
              <p className="text-[9px] text-[#B8B0A0] mt-0.5">
                {Math.round((s.value / totalCount) * 100)}% of staff
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {totalCount > 0 && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-[#1C1712]">Today's Attendance Progress</p>
              <p className="text-[10px] text-[#9A8F82] mt-0.5">{markedCount} marked · {unmarkedCount} pending</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black" style={{ color: presentPct >= 80 ? '#16A34A' : presentPct >= 50 ? '#D97706' : '#DC2626' }}>
                {presentPct}%
              </p>
              <p className="text-[9px] text-[#9A8F82]">attendance rate</p>
            </div>
          </div>

          {/* Stacked progress bar */}
          <div className="h-3 bg-[#F0EBE0] rounded-full overflow-hidden flex">
            <div className="h-full transition-all duration-700 rounded-l-full"
              style={{ width: `${totalCount > 0 ? (presentCount / totalCount) * 100 : 0}%`, background: '#16A34A' }} />
            <div className="h-full transition-all duration-700"
              style={{ width: `${totalCount > 0 ? (leaveCount / totalCount) * 100 : 0}%`, background: '#2563EB' }} />
            <div className="h-full transition-all duration-700"
              style={{ width: `${totalCount > 0 ? (absentCount / totalCount) * 100 : 0}%`, background: '#DC2626' }} />
          </div>

          <div className="flex items-center gap-4 mt-2">
            {[
              { label: 'Present', color: '#16A34A', count: presentCount },
              { label: 'Leave',   color: '#2563EB', count: leaveCount },
              { label: 'Absent',  color: '#DC2626', count: absentCount },
              { label: 'Pending', color: '#D5CFC3', count: unmarkedCount },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-[10px] text-[#9A8F82]">{item.label} ({item.count})</span>
              </div>
            ))}
          </div>

          {unmarkedCount > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-bold text-amber-700">{unmarkedCount} employee{unmarkedCount > 1 ? 's' : ''} not marked yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-sm">

        {/* Table header */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                {['#', 'Employee', 'Department', 'Designation', 'Status', 'Check In', 'Notes'].map(h => (
                  <th key={h} className="text-left text-[9px] font-black text-[#9A8F82] uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(employees ?? []).map((emp: any, i: number) => {
                const rec = attendanceMap[emp.id]
                const cfg = rec ? STATUS_CONFIG[rec.status] : null
                const g = GRADIENTS[i % GRADIENTS.length]
                return (
                  <tr key={emp.id}
                    className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors"
                    style={{ background: !rec ? '#FFFDF5' : undefined }}>
                    <td className="pl-5 pr-2 py-3.5">
                      <span className="text-[10px] font-bold text-[#C4BAB0]">{i + 1}</span>
                    </td>
                    <td className="pl-2 pr-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, boxShadow: `0 3px 10px ${g[0]}40` }}>
                          {ini(emp.full_name)}
                        </div>
                        <p className="text-sm font-bold text-[#1C1712]">{emp.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {emp.department ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: '#F5F0E8', color: '#7A6E60', border: '1px solid #E8E2D8' }}>
                          {emp.department}
                        </span>
                      ) : <span className="text-[#C4BAB0]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#7A6E60]">{emp.designation ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <AttendanceStatusDropdown
                        employeeId={emp.id}
                        companyId={profile.company_id}
                        date={today}
                        currentStatus={rec?.status ?? null}
                        recordId={rec?.id ?? null}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#7A6E60] font-mono">
                        {rec?.check_in
                          ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 pr-5">
                      <p className="text-xs text-[#7A6E60] max-w-[140px] truncate">{rec?.notes ?? '—'}</p>
                    </td>
                  </tr>
                )
              })}

              {!employees?.length && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-[#B8860B]" />
                    </div>
                    <p className="text-[#1C1712] font-bold">No employees found</p>
                    <p className="text-[#9A8F82] text-sm mt-1">Add employees in HRMS first</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#F0EBE0]">
          {(employees ?? []).map((emp: any, i: number) => {
            const rec = attendanceMap[emp.id]
            const g = GRADIENTS[i % GRADIENTS.length]
            return (
              <div key={emp.id} className="px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
                    {ini(emp.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1C1712]">{emp.full_name}</p>
                    <p className="text-[10px] text-[#9A8F82]">{emp.designation ?? ''} {emp.department ? `· ${emp.department}` : ''}</p>
                  </div>
                </div>
                <AttendanceStatusDropdown
                  employeeId={emp.id}
                  companyId={profile.company_id}
                  date={today}
                  currentStatus={rec?.status ?? null}
                  recordId={rec?.id ?? null}
                />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {employees?.length > 0 && (
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between"
            style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] text-[#9A8F82]">
              <span className="font-bold text-[#1C1712]">{markedCount}</span> of <span className="font-bold text-[#1C1712]">{totalCount}</span> marked
            </p>
            <p className="text-[10px] text-[#B8B0A0]">HR & Admin · GK CRM</p>
          </div>
        )}
      </div>
    </div>
  )
}