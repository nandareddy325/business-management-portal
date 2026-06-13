'use client'

interface Props { defaultValue: string }

export function DatePicker({ defaultValue }: Props) {
  return (
    <input
      type="date"
      defaultValue={defaultValue}
      onChange={(e) => {
        window.location.href = `?date=${e.target.value}`
      }}
      className="bg-[#F5F0E8] border border-[#DDD5C4] rounded-xl px-3 py-2 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
    />
  )
}