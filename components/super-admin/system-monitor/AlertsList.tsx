// FILE 10: components/super-admin/system-monitor/AlertsList.tsx
// ============================================================================
'use client'
import { AlertCircle, Trash2 } from 'lucide-react'

interface Alert {
  id: string
  title: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  message: string
}

interface AlertsListProps {
  alerts?: Alert[]
  loading?: boolean
}

export function AlertsList({ alerts = [], loading }: AlertsListProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading alerts...</div>
  if (alerts.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No alerts</div>

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`rounded-lg p-4 border flex items-start justify-between gap-4 ${
          alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 
          alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${
              alert.severity === 'critical' ? 'text-red-600' : 
              alert.severity === 'warning' ? 'text-amber-600' : 
              'text-blue-600'
            }`} />
            <div>
              <p className={`text-sm font-bold ${
                alert.severity === 'critical' ? 'text-red-900' : 
                alert.severity === 'warning' ? 'text-amber-900' : 
                'text-blue-900'
              }`}>{alert.title}</p>
              <p className={`text-xs mt-1 ${
                alert.severity === 'critical' ? 'text-red-700' : 
                alert.severity === 'warning' ? 'text-amber-700' : 
                'text-blue-700'
              }`}>{alert.message}</p>
              <p className="text-[10px] mt-2 opacity-60">{new Date(alert.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-black/10 text-black/40 hover:text-red-600 flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

