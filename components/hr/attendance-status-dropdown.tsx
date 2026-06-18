'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  employeeId: string
  companyId: string
  date: string
  currentStatus: string | null
  recordId: string | null
}

const OPTIONS = [
  { value: 'present',  label: 'Present',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'absent',   label: 'Absent',   bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  { value: 'half_day', label: 'Half Day', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  { value: 'leave',    label: 'Leave',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
]

export function AttendanceStatusDropdown({ employeeId, companyId, date, currentStatus, recordId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const current = OPTIONS.find(o => o.value === status)

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 180)
    }
  }, [open])

  const handleSelect = async (value: string) => {
    setOpen(false)
    if (value === status) return

    const previousStatus = status
    setLoading(true)
    setError(null)

    // Keep check_in consistent with status on both insert AND update,
    // so switching away from "present" clears any stale check-in time.
    const checkIn = value === 'present' ? `${date}T09:00:00` : null

    const { error: dbError } = recordId
      ? await supabase
          .from('attendance')
          .update({ status: value, check_in: checkIn })
          .eq('id', recordId)
      : await supabase.from('attendance').insert({
          company_id: companyId,
          employee_id: employeeId,
          attendance_date: date,
          status: value,
          check_in: checkIn,
        })

    if (dbError) {
      console.error('Failed to update attendance:', dbError.message)
      setError('Failed to save. Try again.')
      setStatus(previousStatus)
      setLoading(false)
      return
    }

    setStatus(value)
    setLoading(false)
    router.refresh()
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
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="absolute top-full mt-1 left-0 text-[10px] text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 bg-white border border-[#E2D9C8] rounded-xl shadow-xl z-50 min-w-[120px]`}>
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#F5F0E8] ${
                  status === opt.value ? `${opt.bg} ${opt.text}` : 'text-[#7A6E60]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.dot} flex-shrink-0`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}