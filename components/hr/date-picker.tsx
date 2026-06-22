'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'

interface Props {
  defaultValue: string
}

export function DatePicker({ defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue)

  return (
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
  )
}