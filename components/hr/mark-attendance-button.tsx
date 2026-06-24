'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, X } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase/client'

interface Employee { id: string; full_name: string; designation?: string; department?: string }
interface Props {
  companyId: string
  date: string
  employees: Employee[]
  attendanceMap: Record<string, any>
}

const STATUS_OPTIONS = [
  { value: 'present',  label: 'Present',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'absent',   label: 'Absent',   color: 'bg-red-50 text-red-600 border-red-200' },
  { value: 'half_day', label: 'Half Day', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'leave',    label: 'Leave',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
]

// Convert IST HH:MM + date to UTC ISO string
function istToUTC(date: string, timeHHMM: string): string {
  const [hours, minutes] = timeHHMM.split(':').map(Number)
  // Create date in IST — subtract 5h30m to get UTC
  const utcMs = new Date(`${date}T00:00:00Z`).getTime()
    + hours * 60 * 60 * 1000
    + minutes * 60 * 1000
    - 5.5 * 60 * 60 * 1000  // subtract IST offset
  return new Date(utcMs).toISOString()
}

export function MarkAttendanceButton({ companyId, date, employees, attendanceMap }: Props) {
  const supabase = createClientSupabaseClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    employees.forEach(emp => {
      init[emp.id] = attendanceMap[emp.id]?.status ?? 'present'
    })
    return init
  })

  const [checkIns, setCheckIns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    employees.forEach(emp => {
      const existing = attendanceMap[emp.id]?.check_in
      if (existing) {
        // Convert existing UTC to IST for display
        const istTime = new Date(existing).toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        })
        init[emp.id] = istTime.slice(0, 5)
      } else {
        init[emp.id] = '09:00'
      }
    })
    return init
  })

  const markAll = (status: string) => {
    const updated: Record<string, string> = {}
    employees.forEach(emp => { updated[emp.id] = status })
    setStatuses(updated)
  }

  const handleSubmit = async () => {
    if (!employees.length) return
    setLoading(true)
    setError('')

    for (const emp of employees) {
      const existing = attendanceMap[emp.id]
      const showCheckIn = statuses[emp.id] === 'present' || statuses[emp.id] === 'half_day'

      const record = {
        company_id: companyId,
        employee_id: emp.id,
        attendance_date: date,
        status: statuses[emp.id] ?? 'present',
        check_in: showCheckIn
          ? istToUTC(date, checkIns[emp.id] ?? '09:00')
          : null,
      }

      if (existing?.id) {
        const { error: err } = await supabase
          .from('attendance')
          .update(record)
          .eq('id', existing.id)
        if (err) { setError(err.message); setLoading(false); return }
      } else {
        const { error: err } = await supabase
          .from('attendance')
          .insert(record)
        if (err) { setError(err.message); setLoading(false); return }
      }
    }

    setLoading(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
      router.refresh()
    }, 800)
  }

  const presentCount = Object.values(statuses).filter(s => s === 'present').length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#1C1712] hover:bg-[#2d2822] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        <CheckSquare className="w-4 h-4" />
        Mark Attendance
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FEFCF8] border border-[#DDD5C4] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2D9C8] flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-[#1C1712]">Mark Attendance</h2>
                <p className="text-xs text-[#7A6E60] mt-0.5">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#9A8F82] hover:text-[#1C1712] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#F0EBE0] flex-shrink-0">
              <p className="text-xs text-[#7A6E60] mb-2 font-medium">Mark all as:</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => markAll(opt.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${opt.color}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {employees.map(emp => {
                const currentStatus = statuses[emp.id] ?? 'present'
                const showCheckIn = currentStatus === 'present' || currentStatus === 'half_day'
                return (
                  <div key={emp.id} className="bg-white border border-[#E2D9C8] rounded-xl p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#F0EBE0] rounded-lg flex items-center justify-center text-xs font-bold text-[#7A6E60] flex-shrink-0">
                        {emp.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1C1712] truncate">{emp.full_name}</p>
                        <p className="text-[10px] text-[#9A8F82]">
                          {emp.department ?? ''}{emp.designation ? ` · ${emp.designation}` : ''}
                        </p>
                      </div>
                      {showCheckIn && (
                        <div className="flex-shrink-0">
                          <p className="text-[9px] text-[#9A8F82] mb-0.5 text-right">IST Time</p>
                          <input
                            type="time"
                            value={checkIns[emp.id] ?? '09:00'}
                            onChange={e => setCheckIns(prev => ({ ...prev, [emp.id]: e.target.value }))}
                            className="text-xs bg-[#F5F0E8] border border-[#DDD5C4] rounded-lg px-2 py-1 text-[#1C1712] outline-none focus:border-[#B8860B] w-24"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setStatuses(prev => ({ ...prev, [emp.id]: opt.value }))}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                            currentStatus === opt.value
                              ? opt.color + ' ring-1 ring-offset-0 ring-current'
                              : 'bg-[#F5F0E8] text-[#9A8F82] border-[#E2D9C8] hover:bg-[#EDE8DF]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {!employees.length && (
                <div className="text-center py-8 text-[#9A8F82] text-sm">
                  No employees found. Add employees in HRMS first.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E2D9C8] flex-shrink-0">
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#7A6E60]">
                  <span className="font-semibold text-emerald-600">{presentCount}</span> present ·{' '}
                  <span className="font-semibold text-[#1C1712]">{employees.length}</span> total
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setOpen(false)}
                  className="flex-1 border border-[#DDD5C4] text-[#7A6E60] py-2.5 rounded-xl text-sm font-medium hover:bg-[#F5F0E8] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading || !employees.length}
                  className="flex-1 bg-[#1C1712] hover:bg-[#2d2822] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}