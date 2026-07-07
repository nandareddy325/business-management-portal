'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  employeeId: string
  companyId: string
  date: string
  currentStatus: string | null
  recordId: string | null
  currentLeaveType?: string | null
}

const OPTIONS = [
  { value: 'present',  label: 'Present',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'absent',   label: 'Absent',   bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  { value: 'half_day', label: 'Half Day', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  { value: 'leave',    label: 'Leave',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
]

const LEAVE_TYPES = [
  { value: 'CL', label: 'Casual Leave' },
  { value: 'SL', label: 'Sick Leave' },
  { value: 'EL', label: 'Earned Leave' },
]

export function AttendanceStatusDropdown({ employeeId, companyId, date, currentStatus, recordId, currentLeaveType }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showLeaveTypes, setShowLeaveTypes] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [leaveType, setLeaveType] = useState(currentLeaveType ?? null)
  const [loading, setLoading] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const current = OPTIONS.find(o => o.value === status)
  const currentLeaveLabel = LEAVE_TYPES.find(l => l.value === leaveType)?.label

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 220)
    }
  }, [open])

  const applyStatus = async (value: string, leaveTypeValue: string | null) => {
    setOpen(false)
    setShowLeaveTypes(false)
    if (value === status && leaveTypeValue === leaveType) return

    const previousStatus = status
    const previousLeaveType = leaveType
    setLoading(true)
    setError(null)

    const checkIn = value === 'present'
      ? new Date(`${date}T09:00:00+05:30`).toISOString()
      : null

    const { error: dbError } = await supabase.rpc('set_attendance_status', {
      p_attendance_id: recordId,
      p_employee_id:   employeeId,
      p_company_id:    companyId,
      p_date:          date,
      p_status:        value,
      p_leave_type:    leaveTypeValue,
      p_check_in:      checkIn,
    })

    if (dbError) {
      console.error('Failed to update attendance:', dbError.message)
      setError('Failed to save. Try again.')
      setStatus(previousStatus)
      setLeaveType(previousLeaveType)
      setLoading(false)
      return
    }

    setStatus(value)
    setLeaveType(leaveTypeValue)
    setLoading(false)
    router.refresh()
  }

  const handleSelect = (value: string) => {
    if (value === 'leave') {
      setShowLeaveTypes(true)
      return
    }
    applyStatus(value, null)
  }

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(prev => !prev)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
          current ? `${current.bg} ${current.text}` : 'bg-[#F0EBE0] text-[#9A8F82]'
        } ${loading ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {current && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} flex-shrink-0`} />}
        {loading ? '...' : (current?.label ?? 'Not marked')}
        {current?.value === 'leave' && currentLeaveLabel && (
          <span className="text-[9px] opacity-70">({leaveType})</span>
        )}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="absolute top-full mt-1 left-0 text-[10px] text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowLeaveTypes(false) }} />
          <div className={`absolute ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 bg-white border border-[#E2D9C8] rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden`}>

            {!showLeaveTypes ? (
              OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#F5F0E8] ${
                    status === opt.value ? `${opt.bg} ${opt.text}` : 'text-[#7A6E60]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dot} flex-shrink-0`} />
                    {opt.label}
                  </span>
                  {opt.value === 'leave' && <ChevronRight size={12} className="opacity-50" />}
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => setShowLeaveTypes(false)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] text-[#9A8F82] border-b border-[#F0EBE0] hover:bg-[#F5F0E8]"
                >
                  ← Back
                </button>
                {LEAVE_TYPES.map(lt => (
                  <button
                    key={lt.value}
                    onClick={() => applyStatus('leave', lt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#F5F0E8] ${
                      status === 'leave' && leaveType === lt.value ? 'bg-blue-50 text-blue-700' : 'text-[#7A6E60]'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-[#B8860B] w-6">{lt.value}</span>
                    {lt.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}