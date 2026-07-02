// components/super-admin/dashboard/HealthStatus.tsx
'use client'

import { CheckCircle, AlertCircle, XCircle, RefreshCw, Activity } from 'lucide-react'

interface ServiceHealth {
  name: string
  status: 'operational' | 'degraded' | 'down'
  uptime: number
  responseTime: number
  lastCheck: string
}

interface HealthStatusProps {
  services?: ServiceHealth[]
  loading?: boolean
}

export function HealthStatus({ services, loading }: HealthStatusProps) {
  const defaultServices: ServiceHealth[] = [
    {
      name: 'API Server',
      status: 'operational',
      uptime: 99.9,
      responseTime: 145,
      lastCheck: '2 minutes ago'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: 99.8,
      responseTime: 89,
      lastCheck: '1 minute ago'
    },
    {
      name: 'Cache Server',
      status: 'operational',
      uptime: 99.5,
      responseTime: 34,
      lastCheck: '3 minutes ago'
    },
    {
      name: 'Email Service',
      status: 'degraded',
      uptime: 98.2,
      responseTime: 2100,
      lastCheck: '5 minutes ago'
    },
  ]

  const displayServices = services || defaultServices

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={18} className="text-emerald-600" />
      case 'degraded':
        return <AlertCircle size={18} className="text-amber-600" />
      case 'down':
        return <XCircle size={18} className="text-red-600" />
      default:
        return <Activity size={18} className="text-black/40" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      case 'degraded':
        return 'bg-amber-50 text-amber-700 ring-amber-200'
      case 'down':
        return 'bg-red-50 text-red-700 ring-red-200'
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-200'
    }
  }

  const overallStatus = displayServices.every(s => s.status === 'operational')
    ? 'healthy'
    : displayServices.some(s => s.status === 'down')
    ? 'critical'
    : 'degraded'

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-[#1C1712] tracking-tight">System Health</h2>
          <p className="text-xs text-black/50 mt-1">Real-time service monitoring</p>
        </div>
        <button className="p-2 rounded-lg bg-black/5 hover:bg-black/10 text-black/60 hover:text-black transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-4 rounded-xl bg-black/2 border border-black/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              overallStatus === 'healthy' ? 'bg-emerald-500' :
              overallStatus === 'critical' ? 'bg-red-500' :
              'bg-amber-500'
            } animate-pulse`} />
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase">Overall Status</p>
              <p className={`text-sm font-bold mt-0.5 ${
                overallStatus === 'healthy' ? 'text-emerald-700' :
                overallStatus === 'critical' ? 'text-red-700' :
                'text-amber-700'
              }`}>
                {overallStatus === 'healthy' ? '✓ All Systems Operational' :
                 overallStatus === 'critical' ? '✗ Critical Issues' :
                 '⚠ Degraded Performance'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-black/60 uppercase">Uptime</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">99.1%</p>
          </div>
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-black/50">Loading health status...</p>
          </div>
        ) : (
          displayServices.map((service, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ring-1 transition-all hover:shadow-md ${getStatusColor(service.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="pt-0.5">
                    {getStatusIcon(service.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{service.name}</h3>
                    <div className="flex items-center gap-3 text-xs mt-1.5">
                      <span className="font-mono font-bold">{service.uptime}% uptime</span>
                      <span>•</span>
                      <span className="font-mono">{service.responseTime}ms response</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold opacity-75">{service.lastCheck}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-black/8">
        <p className="text-[10px] text-black/50 flex items-center justify-between">
          <span>Last updated: Just now</span>
          <span>Next check in: 60s</span>
        </p>
      </div>
    </div>
  )
}