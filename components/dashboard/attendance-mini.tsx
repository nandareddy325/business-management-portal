'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────
// Matches the `attend_status` enum on the `attendance` table:
// present | absent | half_day | on_leave | holiday
type DBStatus = 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday'
type DisplayCode = 'P' | 'A' | 'L' | 'HD' | 'H' | ''

const STATUS_TO_CODE: Record<DBStatus, DisplayCode> = {
  present:  'P',
  absent:   'A',
  half_day: 'HD',
  on_leave: 'L',
  holiday:  'H',
}

const colorMap: Record<DisplayCode, string> = {
  P:  'bg-emerald-50 text-emerald-700',
  A:  'bg-red-50 text-red-700',
  L:  'bg-amber-50 text-amber-700',
  HD: 'bg-blue-50 text-blue-700',
  H:  'bg-[#F0EBE0] text-[#7A6E60]',
  '': 'bg-[#FAFAF8] text-[#D5CFC3]',
}

const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function AttendanceMini({ employeeId }: { employeeId?: string }) {
  const [loading, setLoading] = useState(true)
  const [cells, setCells] = useState<DisplayCode[]>([])
  const [leadingBlanks, setLeadingBlanks] = useState(0)
  const [monthLabel, setMonthLabel] = useState('')
  const [summary, setSummary] = useState({ present: 0, absent: 0, leave: 0 })
  const [noEmployee, setNoEmployee] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        let empId = employeeId

        // If no employeeId passed in, resolve the logged-in user's own employee record.
        // Tries employees.user_id first (newer schema), falls back to profile_id linkage.
        if (!empId) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { setNoEmployee(true); setLoading(false); return }

          const { data: byUser } = await supabase
            .from('employees').select('id').eq('user_id', user.id).maybeSingle()

          if (byUser?.id) {
            empId = byUser.id
          } else {
            const { data: prof } = await supabase
              .from('profiles').select('id').eq('id', user.id).maybeSingle()
            if (prof?.id) {
              const { data: byProfile } = await supabase
                .from('employees').select('id').eq('profile_id', prof.id).maybeSingle()
              empId = byProfile?.id
            }
          }
        }

        if (!empId) { setNoEmployee(true); setLoading(false); return }

        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        // JS getDay(): 0=Sun..6=Sat. Grid is Monday-first, so shift accordingly.
        const jsDay = new Date(year, month, 1).getDay()
        const blanks = jsDay === 0 ? 6 : jsDay - 1

        const pad = (n: number) => String(n).padStart(2, '0')
        const startStr = `${year}-${pad(month + 1)}-01`
        const endStr = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`

        const { data: records } = await supabase
          .from('attendance')
          .select('date, status')
          .eq('employee_id', empId)
          .gte('date', startStr)
          .lte('date', endStr)

        const byDate: Record<string, DBStatus> = {}
        ;(records || []).forEach((r: any) => { byDate[r.date] = r.status })

        const arr: DisplayCode[] = []
        let p = 0, a = 0, l = 0
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${year}-${pad(month + 1)}-${pad(d)}`
          const status = byDate[ds]
          const code: DisplayCode = status ? STATUS_TO_CODE[status] : ''
          arr.push(code)
          if (code === 'P') p++
          if (code === 'A') a++
          if (code === 'L') l++
        }

        setCells(arr)
        setLeadingBlanks(blanks)
        setSummary({ present: p, absent: a, leave: l })
        setMonthLabel(now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [employeeId])

  if (loading) {
    return (
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 mb-2 flex items-center justify-center" style={{ minHeight: 200 }}>
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (noEmployee) {
    return (
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 mb-2 text-center">
        <p className="text-sm text-[#7A6E60]">Attendance record not found for this user.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">
            {monthLabel} — Attendance Overview
          </h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">P Present ({summary.present})</span>
            <span className="bg-red-50 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">A Absent ({summary.absent})</span>
            <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">L Leave ({summary.leave})</span>
            <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">HD Half Day</span>
            <span className="bg-[#F0EBE0] text-[#7A6E60] text-[11px] font-semibold px-2 py-0.5 rounded-full">H Holiday</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayHeaders.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#7A6E60] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Attendance cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
        {cells.map((code, i) => (
          <div
            key={i}
            className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold ${colorMap[code]}`}
          >
            {code || '·'}
          </div>
        ))}
      </div>
    </div>
  )
}