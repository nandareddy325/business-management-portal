'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const stats = [
  { id: '1', label: 'Total Leads', value: '248', change: '+14% from last month', type: 'up', bg: 'bg-blue-50', text: 'text-blue-700', icon: '◎' },
  { id: '2', label: 'Total Clients', value: '86', change: '+8% from last month', type: 'up', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '♟' },
  { id: '3', label: 'Employees', value: '34', change: 'No change', type: 'neutral', bg: 'bg-purple-50', text: 'text-purple-700', icon: '⚇' },
  { id: '4', label: 'Active Projects', value: '19', change: '+3 new this week', type: 'up', bg: 'bg-amber-50', text: 'text-amber-700', icon: '◈' },
  { id: '5', label: 'Revenue (Jun)', value: '₹4.2L', change: '+22% vs last month', type: 'up', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '₹' },
  { id: '6', label: 'Expenses (Jun)', value: '₹1.1L', change: '-5% vs last month', type: 'down', bg: 'bg-red-50', text: 'text-red-700', icon: '↓' },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-5">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${stat.bg} ${stat.text}`}>
            {stat.icon}
          </div>
          <p className="text-xs text-[#7A6E60] font-medium">{stat.label}</p>
          <p className="font-serif text-[26px] text-[#1C1712] my-1 leading-none">{stat.value}</p>
          <div className="flex items-center gap-1 text-xs font-medium">
            {stat.type === 'up' && <TrendingUp size={12} className="text-emerald-600" />}
            {stat.type === 'down' && <TrendingDown size={12} className="text-red-600" />}
            {stat.type === 'neutral' && <Minus size={12} className="text-[#7A6E60]" />}
            <span className={
              stat.type === 'up' ? 'text-emerald-600' :
              stat.type === 'down' ? 'text-red-600' :
              'text-[#7A6E60]'
            }>
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}