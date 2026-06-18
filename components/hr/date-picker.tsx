'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'

interface Props {
  defaultValue: string
}

export function DatePicker({ defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue)

  const parsed = value ? new Date(`${value}T00:00:00`) : null
  const formatted =
    parsed && !isNaN(parsed.getTime())
      ? parsed.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : ''

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="relative flex items-center">
        <Calendar size={15} className="absolute left-3 text-[#B8860B] pointer-events-none" />
        <input
          type="date"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            window.location.href = `?date=${e.target.value}`
          }}
          className="bg-[#F5F0E8] border border-[#DDD5C4] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1C1712] outline-none transition-all hover:border-[#B8860B]/50 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/15 [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
      </div>
      {formatted && <p className="text-[10px] text-[#9A8F82] pl-1">{formatted}</p>}
    </div>
  )
}