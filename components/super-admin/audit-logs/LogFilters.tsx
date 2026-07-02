// FILE 2: components/super-admin/audit-logs/LogFilters.tsx
// ============================================================================
'use client'

import { Search, Filter, Calendar } from 'lucide-react'

interface LogFiltersProps {
  onSearchChange?: (value: string) => void
  onFilterChange?: (filter: any) => void
  onDateChange?: (dates: { start?: string; end?: string }) => void
}

export function LogFilters({ onSearchChange, onFilterChange, onDateChange }: LogFiltersProps) {
  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search by user, action, or company..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/3 border border-black/8 text-xs font-medium text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <button className="px-3 py-2 rounded-lg bg-black/5 border border-black/8 text-xs font-semibold text-black/70 hover:bg-black/10 transition-all flex items-center gap-2">
          <Filter size={14} /> Filters
        </button>
        <button className="px-3 py-2 rounded-lg bg-black/5 border border-black/8 text-xs font-semibold text-black/70 hover:bg-black/10 transition-all flex items-center gap-2">
          <Calendar size={14} /> Date
        </button>
      </div>
    </div>
  )
}
