'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  employeeId: string
  isCheckedIn: boolean
  isCheckedOut: boolean
  attendanceId: string | null
  checkInTimeISO?: string | null
  checkOutTimeISO?: string | null
}

export function AttendanceMarkButton({
  employeeId, isCheckedIn, isCheckedOut, attendanceId,
  checkInTimeISO, checkOutTimeISO
}: Props) {
  const [loading, setLoading]       = useState(false)
  const [checkedIn, setCheckedIn]   = useState(isCheckedIn)
  const [checkedOut, setCheckedOut] = useState(isCheckedOut)
  const [checkInTime, setCheckInTime]   = useState<string | null>(checkInTimeISO ?? null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(checkOutTimeISO ?? null)
  const [attId, setAttId]     = useState<string | null>(attendanceId)
  const [message, setMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState('')

  // Live clock — browser time (already IST)
  useEffect(() => {
    const update = () => setCurrentTime(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    )
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Convert UTC ISO to IST display time
  const fmtIST = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })

  const handleCheckIn = async () => {
    if (checkedIn) return // prevent double click
    setLoading(true); setMessage(null)
    try {
      const now = new Date().toISOString()
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD in IST
      const { data, error } = await supabase
        .from('attendance')
        .insert({ employee_id: employeeId, attendance_date: today, check_in: now, status: 'present' })
        .select().single()
      if (error) throw error
      setAttId(data.id)
      setCheckedIn(true)
      setCheckInTime(now)
      setMessage('✅ Checked in successfully!')
    } catch (e: any) {
      setMessage('❌ ' + (e.message || 'Failed to check in'))
    }
    setLoading(false)
  }

  const handleCheckOut = async () => {
    if (!attId || checkedOut) return
    setLoading(true); setMessage(null)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('attendance').update({ check_out: now }).eq('id', attId)
      if (error) throw error
      setCheckedOut(true)
      setCheckOutTime(now)
      setMessage('✅ Checked out successfully!')
    } catch (e: any) {
      setMessage('❌ ' + (e.message || 'Failed to check out'))
    }
    setLoading(false)
  }

  // ── Both done ──
  if (checkedIn && checkedOut) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-[#7A6E60]">
              Check In: {checkInTime ? fmtIST(checkInTime) : '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-[#E2D9C8]" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs font-medium text-[#7A6E60]">
              Check Out: {checkOutTime ? fmtIST(checkOutTime) : '—'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span className="text-base">✅</span>
          <p className="text-sm font-bold text-emerald-700">Attendance complete for today!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Status dots */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${checkedIn ? 'bg-emerald-400' : 'bg-[#E2D9C8]'}`} />
          <span className="text-xs font-medium text-[#7A6E60]">
            Check In: {checkedIn && checkInTime ? fmtIST(checkInTime) : '—'}
          </span>
        </div>
        <div className="w-px h-4 bg-[#E2D9C8]" />
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${checkedOut ? 'bg-red-400' : 'bg-[#E2D9C8]'}`} />
          <span className="text-xs font-medium text-[#7A6E60]">
            Check Out: {checkedOut && checkOutTime ? fmtIST(checkOutTime) : '—'}
          </span>
        </div>
      </div>

      {/* Check In */}
      {!checkedIn && (
        <button onClick={handleCheckIn} disabled={loading || !currentTime}
          className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #16A34A, #047857)', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Marking...</>
            : <>🟢 Check In — {currentTime}</>}
        </button>
      )}

      {/* Already checked in confirmation */}
      {checkedIn && (
        <div className="py-2.5 rounded-xl text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p className="text-xs font-bold text-emerald-700">
            ✅ Checked in at {checkInTime ? fmtIST(checkInTime) : '—'}
          </p>
        </div>
      )}

      {/* Check Out */}
      {checkedIn && !checkedOut && (
        <button onClick={handleCheckOut} disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}>
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Marking...</>
            : <>🔴 Check Out — {currentTime}</>}
        </button>
      )}

      {message && <p className="text-xs text-center font-medium text-[#7A6E60]">{message}</p>}
    </div>
  )
}