'use client'

export function AttendanceMini() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  const attendance: ('P' | 'A' | 'L' | 'H')[] = [
    'H', 'H', 'P', 'P', 'P', 'L', 'H',
    'P', 'P', 'P', 'A', 'P', 'L', 'H',
    'P', 'P', 'P', 'P', 'P', 'H', 'H',
    'P', 'P', 'P',
  ]

  const colorMap = {
    P: 'bg-emerald-50 text-emerald-700',
    A: 'bg-red-50 text-red-700',
    L: 'bg-amber-50 text-amber-700',
    H: 'bg-[#F0EBE0] text-[#7A6E60]',
  }

  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">
            June 2026 — Attendance Overview
          </h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">P Present</span>
            <span className="bg-red-50 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">A Absent</span>
            <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">L Leave</span>
            <span className="bg-[#F0EBE0] text-[#7A6E60] text-[11px] font-semibold px-2 py-0.5 rounded-full">H Holiday</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#7A6E60] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Attendance cells */}
      <div className="grid grid-cols-7 gap-1">
        {attendance.map((status, i) => (
          <div
            key={i}
            className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold ${colorMap[status]}`}
          >
            {status}
          </div>
        ))}
      </div>
    </div>
  )
}