// FILE 9: components/super-admin/system-monitor/ServiceStatus.tsx
// ============================================================================
'use client'
import { Server } from 'lucide-react'
import { SystemStatus } from '@/types/admin'

interface ServiceStatusProps {
  services: SystemStatus[] | null
  loading?: boolean
}

export function ServiceStatus({ services, loading }: ServiceStatusProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading services...</div>
  if (!services || services.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No services found</div>

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/8 bg-black/2">
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Service</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Uptime</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black/60 uppercase">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {services.map(service => (
              <tr key={service.id} className="hover:bg-black/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Server size={14} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-black/80">{service.service_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-semibold text-black/80">{service.uptime_percent}%</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium text-black/60">{service.response_time_ms}ms</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

