// FILE 6: components/super-admin/support/TicketStats.tsx
// ============================================================================
import { AlertCircle, Clock, CheckCircle, MessageSquare } from 'lucide-react'

interface TicketStatsProps {
  open: number
  inProgress: number
  resolved: number
  avgResponseTime?: number
}

export function TicketStats({ open, inProgress, resolved, avgResponseTime }: TicketStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      {[
        { label: 'Open', value: open, icon: AlertCircle, color: 'red' },
        { label: 'In Progress', value: inProgress, icon: Clock, color: 'blue' },
        { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'emerald' },
        { label: 'Avg Response', value: `${avgResponseTime || 0}h`, icon: MessageSquare, color: 'amber' },
      ].map((stat, i) => {
        const Icon = stat.icon
        return (
          <div key={i} className="bg-white ring-1 ring-black/8 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-black/60 uppercase">{stat.label}</p>
                <p className="text-2xl font-bold text-black/80 mt-2">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${stat.color === 'red' ? 'bg-red-100' : stat.color === 'blue' ? 'bg-blue-100' : stat.color === 'emerald' ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center`}>
                <Icon size={16} className={stat.color === 'red' ? 'text-red-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


