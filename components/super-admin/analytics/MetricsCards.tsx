// FILE 13: components/super-admin/analytics/MetricsCards.tsx
// ============================================================================
'use client'
import { TrendingUp, TrendingDown, Activity, Users, Clock } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: { value: number; isPositive: boolean }
  icon: React.ReactNode
}

export function MetricsCards() {
  const metrics: MetricCardProps[] = [
    {
      title: 'Total Leads',
      value: '1,234',
      change: { value: 12, isPositive: true },
      icon: <Users size={18} className="text-blue-600" />
    },
    {
      title: 'Conversion Rate',
      value: '34.2%',
      change: { value: 2.3, isPositive: true },
      icon: <TrendingUp size={18} className="text-emerald-600" />
    },
    {
      title: 'Avg Response Time',
      value: '2.4h',
      change: { value: 0.3, isPositive: false },
      icon: <Clock size={18} className="text-amber-600" />
    },
    {
      title: 'Active Users',
      value: '456',
      change: { value: 8.5, isPositive: true },
      icon: <Activity size={18} className="text-purple-600" />
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric, i) => (
        <div key={i} className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
              {metric.icon}
            </div>
            {metric.change && (
              <div className={`flex items-center gap-1 text-xs font-bold ${metric.change.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {metric.change.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {metric.change.value}%
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold text-black/60 uppercase">{metric.title}</p>
          <p className="text-2xl font-bold text-black/80 mt-2">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}

