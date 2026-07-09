'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface Employee {
  id: string
  full_name: string
}

interface AttendanceRecord {
  id: string
  employee_id: string
  attendance_date: string
  status?: string
  check_in?: string
  check_out?: string
}

interface LeaveApp {
  from_date: string
  to_date: string
  leave_type: string
  status: string
}

export default function EmployeeAttendancePage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [records, setRecords]   = useState<AttendanceRecord[]>([])
  const [leaveApps, setLeaveApps] = useState<LeaveApp[]>([])
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState(false)
  const [markedToday, setMarkedToday] = useState(false)
  const [toast, setToast]       = useState('')

  const now      = new Date()
  const year     = now.getFullYear()
  const month    = now.getMonth()
  const today    = now.getDate()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
  const monthEnd   = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: emp } = await supabase
        .from('employees').select('id, full_name').eq('email', user.email!).single()
      if (!emp) { router.push('/login'); return }
      setEmployee(emp)

      const [{ data: recs }, { data: leaves }] = await Promise.all([
        supabase.from('attendance').select('*')
          .eq('employee_id', emp.id)
          .gte('attendance_date', monthStart)
          .lte('attendance_date', monthEnd)
          .order('attendance_date', { ascending: false }),
        supabase.from('leave_applications').select('from_date, to_date, leave_type, status')
          .eq('employee_id', emp.id)
          .eq('status', 'approved')
          .gte('from_date', monthStart)
          .lte('to_date', monthEnd),
      ])

      setRecords(recs ?? [])
      setLeaveApps(leaves ?? [])

      const todayRec = (recs ?? []).find((r: AttendanceRecord) => r.attendance_date === todayStr)
      if (todayRec) setMarkedToday(true)

    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markPresent = async () => {
    if (!employee || marking || markedToday) return
    setMarking(true)
    try {
      const checkIn = new Date().toISOString()
      const { error } = await supabase.from('attendance').insert({
        employee_id:     employee.id,
        attendance_date: todayStr,
        date:            todayStr,
        status:          'present',
        check_in:        checkIn,
      })
      if (error) {
        if (error.code === '23505') {
          setMarkedToday(true)
          setToast('Already marked present today!')
        } else {
          setToast('Error marking attendance. Try again.')
        }
      } else {
        setMarkedToday(true)
        setToast('Attendance marked — Present')
        await loadData()
      }
    } catch (e) { console.error(e) }
    finally {
      setMarking(false)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const dateMap: Record<string, { status: string; checkIn?: string }> = {}

  for (const r of records) {
    dateMap[r.attendance_date] = {
      status: r.status?.toLowerCase() ?? 'present',
      checkIn: r.check_in,
    }
  }
  for (const l of leaveApps) {
    const from = new Date(l.from_date)
    const to   = new Date(l.to_date)
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      if (!dateMap[key]) dateMap[key] = { status: 'leave' }
    }
  }

  const presentCount = Object.values(dateMap).filter(v => v.status === 'present').length
  const absentCount  = Object.values(dateMap).filter(v => v.status === 'absent').length
  const leaveCount   = Object.values(dateMap).filter(v => v.status === 'leave').length

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDayOfMonth(year, month)

  function isWeekend(day: number) {
    return [0, 6].includes(new Date(year, month, day).getDay())
  }

  const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(d => !isWeekend(d) && new Date(year, month, d) <= now).length

  function getDayStatus(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isWeekend(day)) return 'holiday'
    if (new Date(year, month, day) > now) return 'future'
    return dateMap[ds]?.status ?? 'absent'
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700'
      case 'absent':  return 'bg-rose-50 text-rose-600'
      case 'leave':   return 'bg-amber-50 text-amber-700'
      case 'holiday': return 'bg-[#F0EBE0] text-[#B0A594]'
      default:        return 'text-[#C0B8AF]'
    }
  }

  const todayIsWeekend  = isWeekend(today)
  const todayCheckIn    = dateMap[todayStr]?.checkIn
  const mono = { fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }
  const serif = { fontFamily: 'Georgia, serif' }

  if (loading) return (
    <div className="h-screen bg-[#EFE9DD] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#EFE9DD]">
      <div className="max-w-3xl mx-auto py-4 px-3 lg:py-6 lg:px-6">

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 text-sm font-medium text-white shadow-lg border border-[#B8860B]/40"
            style={{ background: '#1C1712' }}>
            {toast}
          </div>
        )}

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
                  <h1 className="text-[24px] text-white italic" style={{ fontFamily: 'Georgia, serif', fontWeight: 500 }}>My Attendance</h1>
                  <p className="text-[11px] text-white/40 mt-1 tracking-wide" style={mono}>{monthName.toUpperCase()} · {workingDays} WORKING DAYS</p>
                </div>
                {!todayIsWeekend && (
                  <button
                    onClick={markPresent}
                    disabled={marking || markedToday}
                    className="flex items-center gap-2 px-4 py-2 border text-[11px] tracking-[1px] uppercase transition-all disabled:opacity-70"
                    style={{
                      ...mono,
                      background: markedToday ? 'rgba(16,185,129,0.1)' : 'transparent',
                      borderColor: markedToday ? 'rgba(16,185,129,0.4)' : '#B8860B',
                      color: markedToday ? '#34d399' : '#D4A537',
                    }}>
                    {marking ? (
                      <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Marking</>
                    ) : markedToday ? (
                      <>✓ {todayCheckIn ? `In ${new Date(todayCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Present'}</>
                    ) : (
                      <>Mark Present</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* §1 — Stats ledger row */}
          <div className="bg-[#FAF7F2] border-t border-[#B8860B]/25 px-6 py-4 lg:px-8">
            <p className="text-[9px] tracking-[3px] text-[#8B6914] font-semibold mb-3 uppercase" style={mono}>§1 — This Month</p>
            <div className="grid grid-cols-4">
              {[
                { label: 'Present', value: presentCount, color: 'text-emerald-700' },
                { label: 'Absent',  value: absentCount,  color: 'text-rose-600' },
                { label: 'Leave',   value: leaveCount,   color: 'text-amber-700' },
                { label: 'Working', value: workingDays,  color: 'text-[#1C1712]' },
              ].map((s, i) => (
                <div key={s.label} className={`text-center ${i > 0 ? 'border-l border-[#E2D9C8]' : ''}`}>
                  <p className={`text-2xl ${s.color}`} style={serif}>{s.value}</p>
                  <p className="text-[9px] tracking-[1px] text-[#9A8F82] uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* §2 — Today status */}
          {!todayIsWeekend && (
            <div className={`px-6 py-3.5 lg:px-8 border-t border-[#B8860B]/25 flex items-center justify-between ${markedToday ? 'bg-emerald-50/40' : 'bg-amber-50/40'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${markedToday ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-[13px] text-[#1C1712]">
                  {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} —{' '}
                  {markedToday
                    ? <span className="text-emerald-700">Present{todayCheckIn ? ` · in at ${new Date(todayCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                    : <span className="text-amber-700">Not marked yet</span>}
                </p>
              </div>
            </div>
          )}

          {/* §3 — Calendar */}
          <div className="bg-white border-t border-[#B8860B]/25 px-6 py-4 lg:px-8">
            <p className="text-[9px] tracking-[3px] text-[#8B6914] font-semibold mb-3 uppercase" style={mono}>§2 — Calendar</p>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-[#9A8F82] py-1" style={mono}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day    = i + 1
                const status = getDayStatus(day)
                const isToday = day === today
                return (
                  <div key={day}
                    className={`aspect-square flex items-center justify-center text-[11px] ${getStatusStyle(status)} ${isToday ? 'ring-2 ring-[#B8860B] ring-offset-1' : ''}`}
                    style={serif}>
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 pt-3 mt-3 border-t border-[#F0EAE0] flex-wrap">
              {[
                { label: 'Present', color: 'bg-emerald-300' },
                { label: 'Absent',  color: 'bg-rose-300' },
                { label: 'Leave',   color: 'bg-amber-300' },
                { label: 'Holiday', color: 'bg-[#E2D9C8]' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 ${l.color}`} />
                  <span className="text-[10px] text-[#9A8F82]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* §4 — Recent records */}
          <div className="bg-[#FAF7F2] border-t border-[#B8860B]/25">
            <p className="text-[9px] tracking-[3px] text-[#8B6914] font-semibold uppercase px-6 lg:px-8 pt-4 pb-1.5" style={mono}>§3 — Recent Records</p>
            <div>
              {records.slice(0, 10).map((r: AttendanceRecord, idx) => {
                const d      = new Date(r.attendance_date)
                const status = r.status?.toLowerCase() ?? 'present'
                const color  = { present: 'text-emerald-700', absent: 'text-rose-600', leave: 'text-amber-700' }[status] ?? 'text-[#9A8F82]'
                return (
                  <div key={r.id} className={`px-6 lg:px-8 py-3 flex items-center justify-between ${idx > 0 ? 'border-t border-[#F0EAE0]' : ''}`}>
                    <div>
                      <p className="text-[13px] text-[#1C1712]" style={serif}>
                        {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-[#9A8F82] mt-0.5">
                        {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                        {r.attendance_date === todayStr && ' · Today'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-medium capitalize ${color}`}>{status}</span>
                      {r.check_in && (
                        <p className="text-[10px] text-[#9A8F82] mt-0.5">
                          In: {new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              {!records.length && (
                <div className="py-10 text-center px-6">
                  <p className="text-[#9A8F82] text-sm">No attendance records yet</p>
                  <p className="text-[#B8B0A0] text-xs mt-1">Tap &ldquo;Mark Present&rdquo; above to check in</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}