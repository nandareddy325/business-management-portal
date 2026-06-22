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

const avatarColors = [
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#C2410C' },
  { bg: '#FFF1F2', text: '#BE123C' },
  { bg: '#ECFEFF', text: '#0E7490' },
]

const deptStyles: Record<string, { bg: string; text: string }> = {
  Design:     { bg: '#EFF6FF', text: '#1D4ED8' },
  Sales:      { bg: '#F0FDF4', text: '#166534' },
  Operations: { bg: '#FFFBEB', text: '#B45309' },
  HR:         { bg: '#FDF4FF', text: '#7E22CE' },
  Finance:    { bg: '#F0FDF4', text: '#166534' },
  IT:         { bg: '#ECFEFF', text: '#0E7490' },
  Marketing:  { bg: '#FFF7ED', text: '#C2410C' },
  CRE:        { bg: '#FFF1F2', text: '#BE123C' },
  MD:         { bg: '#F5F3FF', text: '#6D28D9' },
  Other:      { bg: '#F5F0E8', text: '#7A6E60' },
}

const ini = (name: string) =>
  name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || '?'

const fmtIST = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })

export default async function AttendancePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/login')

  const today = params?.date ?? new Date().toISOString().split('T')[0]
  const displayDate = new Date(today).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const { data: employees } = await supabase
    .from('employees').select('id, full_name, designation, department')
    .eq('company_id', profile.company_id).eq('is_active', true).order('full_name')

  const employeeIds = (employees ?? []).map((e: any) => e.id)

  const { data: attendance } = employeeIds.length > 0
    ? await supabase.from('attendance').select('*').in('employee_id', employeeIds).eq('attendance_date', today)
    : { data: [] }

  const attendanceMap = Object.fromEntries((attendance ?? []).map((a: any) => [a.employee_id, a]))

  const totalCount    = employees?.length ?? 0
  const markedCount   = attendance?.length ?? 0
  const presentCount  = attendance?.filter((a: any) => a.status === 'present').length ?? 0
  const absentCount   = attendance?.filter((a: any) => a.status === 'absent').length ?? 0
  const leaveCount    = attendance?.filter((a: any) => ['half_day', 'leave'].includes(a.status)).length ?? 0
  const unmarkedCount = totalCount - markedCount
  const presentPct    = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4 p-4 md:p-6" style={{ background: '#F5F0E8', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[4px] mb-0.5" style={{ color: '#B8860B' }}>HR & Admin</p>
          <h1 className="text-2xl font-black text-[#1C1712]">Attendance</h1>
          <p className="text-xs text-[#9A8F82] mt-0.5">📅 {displayDate}</p>
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

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff', value: totalCount,   color: '#7C3AED', bg:'#F5F3FF', icon: '👥' },
          { label: 'Present',     value: presentCount, color: '#16A34A', bg:'#F0FDF4', icon: '✅' },
          { label: 'Absent',      value: absentCount,  color: '#DC2626', bg:'#FEF2F2', icon: '❌' },
          { label: 'Leave/Half',  value: leaveCount,   color: '#D97706', bg:'#FFFBEB', icon: '🕐' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 md:p-4" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: s.bg }}>{s.icon}</div>
              <p className="text-[9px] font-black text-[#9A8F82] uppercase tracking-wider text-right">{s.label}</p>
            </div>
            <p className="text-2xl md:text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            {s.label !== 'Total Staff' && totalCount > 0 && (
              <p className="text-[9px] text-[#B8B0A0] mt-0.5">{Math.round((s.value / totalCount) * 100)}% of staff</p>
            )}
          </div>
        ))}
      </div>

      {/* ── PROGRESS ── */}
      {totalCount > 0 && (
        <div className="rounded-2xl p-4" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-[#1C1712]">Today's Attendance Progress</p>
              <p className="text-[10px] text-[#9A8F82]">{markedCount} marked · {unmarkedCount} pending</p>
            </div>
            <p className="text-xl font-black" style={{ color: presentPct >= 80 ? '#16A34A' : presentPct >= 50 ? '#D97706' : '#DC2626' }}>
              {presentPct}%
            </p>
          </div>
          <div className="h-2.5 bg-[#F0EBE0] rounded-full overflow-hidden flex">
            <div className="h-full rounded-l-full" style={{ width:`${(presentCount/totalCount)*100}%`, background:'#16A34A' }}/>
            <div className="h-full" style={{ width:`${(leaveCount/totalCount)*100}%`, background:'#2563EB' }}/>
            <div className="h-full" style={{ width:`${(absentCount/totalCount)*100}%`, background:'#DC2626' }}/>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {[
              { label:'Present', color:'#16A34A', count:presentCount },
              { label:'Leave',   color:'#2563EB', count:leaveCount },
              { label:'Absent',  color:'#DC2626', count:absentCount },
              { label:'Pending', color:'#D5CFC3', count:unmarkedCount },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background:item.color }}/>
                <span className="text-[10px] text-[#9A8F82]">{item.label} ({item.count})</span>
              </div>
            ))}
          </div>
          {unmarkedCount > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:'#FFFBEB', border:'1px solid #FDE68A' }}>
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-bold text-amber-700">{unmarkedCount} employee{unmarkedCount > 1 ? 's' : ''} not marked yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── TABLE + CARDS ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:'1px solid #E8E2D8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background:'#1C1712' }}>
                {['#','Employee','Department','Designation','Status','Check In','Check Out','Notes'].map(h => (
                  <th key={h} className="text-left text-[9px] font-black uppercase tracking-[2px] px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5" style={{ color:'#B8860B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(employees ?? []).map((emp: any, i: number) => {
                const rec = attendanceMap[emp.id]
                const av  = avatarColors[i % avatarColors.length]
                const dept = deptStyles[emp.department] ?? deptStyles['Other']
                return (
                  <tr key={emp.id} className="border-b border-[#F7F5F1] last:border-0 hover:bg-[#FDFAF8] transition-colors"
                    style={{ background: !rec ? '#FFFDF5' : undefined }}>
                    <td className="pl-5 pr-2 py-3.5"><span className="text-[10px] font-bold text-[#C4BAB0]">{i+1}</span></td>
                    <td className="pl-2 pr-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background:av.bg, color:av.text }}>{ini(emp.full_name)}</div>
                        <p className="text-sm font-bold text-[#1C1712]">{emp.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {emp.department ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background:dept.bg, color:dept.text }}>{emp.department}</span> : <span className="text-[#C4BAB0]">—</span>}
                    </td>
                    <td className="px-4 py-3.5"><p className="text-xs text-[#7A6E60]">{emp.designation ?? '—'}</p></td>
                    <td className="px-4 py-3.5">
                      <AttendanceStatusDropdown employeeId={emp.id} companyId={profile.company_id} date={today} currentStatus={rec?.status ?? null} recordId={rec?.id ?? null}/>
                    </td>
                    <td className="px-4 py-3.5">
                      {rec?.check_in ? <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-1 rounded-lg" style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>🟢 {fmtIST(rec.check_in)}</span>
                      : <span className="text-[#C4BAB0] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {rec?.check_out ? <span className="text-xs font-mono font-bold text-red-700 px-2 py-1 rounded-lg" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>🔴 {fmtIST(rec.check_out)}</span>
                      : <span className="text-[#C4BAB0] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 pr-5"><p className="text-xs text-[#7A6E60] max-w-[140px] truncate">{rec?.notes ?? '—'}</p></td>
                  </tr>
                )
              })}
              {!employees?.length && (
                <tr><td colSpan={8} className="py-20 text-center">
                  <div className="w-16 h-16 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-[#B8860B]"/>
                  </div>
                  <p className="text-[#1C1712] font-bold">No employees found</p>
                  <p className="text-[#9A8F82] text-sm mt-1">Add employees in HRMS first</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#F0EBE0]">
          {(employees ?? []).map((emp: any, i: number) => {
            const rec  = attendanceMap[emp.id]
            const av   = avatarColors[i % avatarColors.length]
            const dept = deptStyles[emp.department] ?? deptStyles['Other']
            return (
              <div key={emp.id} className="p-4" style={{ background: !rec ? '#FFFDF5' : undefined }}>
                {/* Name row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background:av.bg, color:av.text }}>{ini(emp.full_name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1C1712] truncate">{emp.full_name}</p>
                    <p className="text-[10px] text-[#9A8F82] truncate">{[emp.designation, emp.department].filter(Boolean).join(' · ')}</p>
                  </div>
                  {emp.department && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:dept.bg, color:dept.text }}>{emp.department}</span>
                  )}
                </div>

                {/* Status */}
                <AttendanceStatusDropdown employeeId={emp.id} companyId={profile.company_id} date={today} currentStatus={rec?.status ?? null} recordId={rec?.id ?? null}/>

                {/* Check in/out */}
                {(rec?.check_in || rec?.check_out) && (
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    {rec?.check_in && (
                      <div className="rounded-xl px-3 py-2 border border-[#BBF7D0]" style={{ background:'#F0FDF4' }}>
                        <p className="text-[9px] text-emerald-700 uppercase font-black tracking-wider">Check In</p>
                        <p className="text-xs font-bold text-emerald-800 mt-0.5 font-mono">🟢 {fmtIST(rec.check_in)}</p>
                      </div>
                    )}
                    {rec?.check_out && (
                      <div className="rounded-xl px-3 py-2 border border-[#FECACA]" style={{ background:'#FEF2F2' }}>
                        <p className="text-[9px] text-red-700 uppercase font-black tracking-wider">Check Out</p>
                        <p className="text-xs font-bold text-red-800 mt-0.5 font-mono">🔴 {fmtIST(rec.check_out)}</p>
                      </div>
                    )}
                  </div>
                )}

                {rec?.notes && (
                  <div className="mt-2 rounded-xl px-3 py-2 border border-[#F0EBE0]" style={{ background:'#FAFAF8' }}>
                    <p className="text-[9px] text-[#7A6E60] uppercase font-black tracking-wider">Notes</p>
                    <p className="text-xs text-[#1C1712] mt-0.5">{rec.notes}</p>
                  </div>
                )}

                {!rec && (
                  <div className="mt-2 rounded-xl px-3 py-2 border border-[#FDE68A]" style={{ background:'#FFFBEB' }}>
                    <p className="text-[11px] font-bold text-amber-700">⚠️ Not marked yet</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {(employees?.length ?? 0) > 0 && (
          <div className="px-5 py-3 border-t border-[#F0EBE0] flex items-center justify-between" style={{ background:'#FAFAF8' }}>
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