// components/super-admin/users/UserStats.tsx
'use client'

import { Users, UserCheck, AlertCircle } from 'lucide-react'

interface UserStatsProps {
  total: number
  active: number
  inactive: number
}

export function UserStats({ total, active, inactive }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-black/80 mt-2">{total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Active</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2">{active}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <UserCheck size={16} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Inactive</p>
            <p className="text-2xl font-bold text-red-700 mt-2">{inactive}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  )
}