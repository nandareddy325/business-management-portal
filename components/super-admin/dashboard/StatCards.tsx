// FILE 17: components/super-admin/dashboard/StatCards.tsx
// ============================================================================
'use client'
import { BarChart3, Users, CreditCard, TrendingUp } from 'lucide-react'

interface StatCardsProps {
  stats?: {
    totalRevenue: number
    totalUsers: number
    activeSubscriptions: number
    growthRate: number
  }
}

export function StatCards({ stats }: StatCardsProps) {
  const defaultStats = {
    totalRevenue: 125000,
    totalUsers: 2340,
    activeSubscriptions: 156,
    growthRate: 23.5,
  }

  const data = stats || defaultStats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-black/80 mt-2">₹{(data.totalRevenue / 100000).toFixed(1)}L</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <BarChart3 size={16} className="text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-black/80 mt-2">{data.totalUsers.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Active Subscriptions</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2">{data.activeSubscriptions}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CreditCard size={16} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-black/60 uppercase">Growth Rate</p>
            <p className="text-2xl font-bold text-purple-700 mt-2">{data.growthRate}%</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp size={16} className="text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}