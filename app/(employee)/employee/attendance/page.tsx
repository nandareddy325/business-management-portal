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

export default function EmployeeAttendancePage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [employee, setEmployee] = useState<any>(null)
  const [records, setRecords]   = useState<any[]>([])
  const [leaveApps, setLeaveApps] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState(false)
  const [markedToday, setMarkedToday] = useState(false)
  const [toast, setToast]       = useState('')

  const now      = new Date()
  const year     = now.getFullYear()
  const month    = now.getMonth()
  const today    = now.getDate()
  const todayStr = now.toISOString().split('T')[0]
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

      // Check if today already marked
      const todayRec = (recs ?? []).find((r: any) => r.attendance_date === todayStr)
      if (todayRec) setMarkedToday(true)

    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  // ── Mark Present Today ──
  const markPresent = async () => {
    if (!employee || marking || markedToday) return
    setMarking(true)
    try {
      const checkIn = new Date().toISOString()
      const { error } = await supabase.from('attendance').insert({
        employee_id:     employee.id,
        attendance_date: todayStr,
        status:          'present',
        check_in:        checkIn,
      })
      if (error) {
        // Duplicate key — already marked
        if (error.code === '23505') {
          setMarkedToday(true)
          setToast('Already marked present today!')
        } else {
          setToast('Error marking attendance. Try again.')
        }
      } else {
        setMarkedToday(true)
        setToast('✅ Attendance marked — Present!')
        await loadData()
      }
    } catch (e) { console.error(e) }
    finally {
      setMarking(false)
      setTimeout(() => setToast(''), 3000)
    }
  }

  // ── Build date map ──
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
      case 'absent':  return 'bg-red-50 text-red-700'
      case 'leave':   return 'bg-amber-50 text-amber-700'
      case 'holiday': return 'bg-[#F5F0E8] text-[#9A8F82]'
      default:        return 'text-[#C0B8AF]'
    }
  }

  const todayIsWeekend  = isWeekend(today)
  const todayCheckIn    = dateMap[todayStr]?.checkIn

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-lg"
          style={{ background: '#1C1712' }}>
          {toast}
        </div>
      )}

      {/* Hero */}
      <div className="bg-[#1C1712] px-6 py-5 relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-32 h-32 rounded-full border border-[#B8860B]/10" />
        <div className="max-w-lg mx-auto">
          <Link href="/employee" className="text-white/35 text-[11px] flex items-center gap-1 mb-2 w-fit hover:text-white/60 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to portal
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-white">My attendance</h1>
              <p className="text-[12px] text-white/30 mt-0.5">{monthName} · {workingDays} working days</p>
            </div>

            {/* Mark Present Button */}
            {!todayIsWeekend && (
              <button
                onClick={markPresent}
                disabled={marking || markedToday}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-60"
                style={{
                  background: markedToday ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #10B981, #059669)',
                  border: markedToday ? '1px solid rgba(34,197,94,0.3)' : 'none',
                  color: markedToday ? '#22c55e' : 'white',
                  boxShadow: markedToday ? 'none' : '0 4px 12px rgba(16,185,129,0.4)',
                }}>
                {marking ? (
                  <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Marking...</>
                ) : markedToday ? (
                  <>✅ {todayCheckIn ? `In: ${new Date(todayCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Present'}</>
                ) : (
                  <>📍 Mark Present</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Present', value: presentCount, bg: 'bg-emerald-50 border-emerald-200', num: 'text-emerald-700', lbl: 'text-emerald-600' },
            { label: 'Absent',  value: absentCount,  bg: 'bg-red-50 border-red-200',         num: 'text-red-700',     lbl: 'text-red-600' },
            { label: 'Leave',   value: leaveCount,   bg: 'bg-amber-50 border-amber-200',     num: 'text-amber-700',   lbl: 'text-amber-600' },
            { label: 'Working', value: workingDays,  bg: 'bg-[#F5F0E8] border-[#E2D9C8]',   num: 'text-[#1C1712]',   lbl: 'text-[#7A6E60]' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
              <p className={`text-[24px] font-medium leading-none ${s.num}`}>{s.value}</p>
              <p className={`text-[10px] mt-1 ${s.lbl}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today status banner */}
        {!todayIsWeekend && (
          <div className={`rounded-2xl p-3.5 flex items-center justify-between border ${
            markedToday
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div>
              <p className={`text-[11px] font-medium ${markedToday ? 'text-emerald-700' : 'text-amber-700'}`}>
                Today — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <p className={`text-[13px] font-medium mt-0.5 ${markedToday ? 'text-emerald-800' : 'text-amber-800'}`}>
                {markedToday
                  ? `Present ${todayCheckIn ? `· Check-in: ${new Date(todayCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                  : 'Not marked yet — tap "Mark Present" to check in'}
              </p>
            </div>
            <span className="text-xl">{markedToday ? '✅' : '⏰'}</span>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-[14px] font-medium text-[#1C1712]">{monthName}</p>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-[#7A6E60] py-1">{d}</div>
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
                    className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium
                      ${getStatusStyle(status)}
                      ${isToday ? 'ring-2 ring-[#B8860B] ring-offset-1' : ''}
                    `}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 border-t border-[#E2D9C8]">
            {[
              { label: 'Present', color: 'bg-emerald-200' },
              { label: 'Absent',  color: 'bg-red-200' },
              { label: 'Leave',   color: 'bg-amber-200' },
              { label: 'Holiday', color: 'bg-[#E2D9C8]' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-[3px] ${l.color}`} />
                <span className="text-[10px] text-[#7A6E60]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white border border-[#E2D9C8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E2D9C8]">
            <p className="text-[14px] font-medium text-[#1C1712]">Recent records</p>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {records.slice(0, 10).map((r: any) => {
              const d      = new Date(r.attendance_date)
              const status = r.status?.toLowerCase() ?? 'present'
              const badge  = {
                present: 'bg-emerald-50 text-emerald-700',
                absent:  'bg-red-50 text-red-700',
                leave:   'bg-amber-50 text-amber-700',
              }[status] ?? 'bg-gray-50 text-gray-600'
              return (
                <div key={r.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#1C1712]">
                      {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-[#7A6E60] mt-0.5">
                      {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                      {r.attendance_date === todayStr && ' · Today'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize ${badge}`}>
                      {status}
                    </span>
                    {r.check_in && (
                      <p className="text-[11px] text-[#7A6E60] mt-1">
                        In: {new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {!records.length && (
              <div className="py-12 text-center">
                <p className="text-[#9A8F82] text-sm">No attendance records yet</p>
                <p className="text-[#B8B0A0] text-xs mt-1">Click "Mark Present" above to check in</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}