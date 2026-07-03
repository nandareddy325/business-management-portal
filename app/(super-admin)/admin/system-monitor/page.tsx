// app/(super-admin)/admin/system-monitor/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Database, AlertTriangle, CheckCircle, Clock, Activity, Server, Zap, RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface ServiceStatus {
  id: string
  service_name: string
  status: 'operational' | 'degraded' | 'down' | 'maintenance'
  response_time_ms: number
  is_healthy: boolean
  checked_at: string
}

interface AlertItem {
  id: string
  severity: 'info' | 'warning' | 'critical'
  service: string
  message: string
  created_at: string
}

export default function SystemMonitorPage() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch system status
      const { data: statusData, error: statusError } = await supabase
        .from('system_status')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(50)

      if (statusError) throw statusError
      setServices(statusData || [])

      // Fetch alerts
      const { data: alertData, error: alertError } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (alertError) throw alertError
      setAlerts(alertData || [])

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching system data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' }
      case 'degraded':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' }
      case 'down':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' }
      case 'maintenance':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' }
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' }
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'warning':
        return 'bg-amber-100 text-amber-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const upServices = services.filter(s => s.is_healthy).length
  const downServices = services.filter(s => !s.is_healthy).length
  const avgResponseTime = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + s.response_time_ms, 0) / services.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DE] p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1712]">System Monitor</h1>
            <p className="text-sm text-[#9A8F82] mt-1">Real-time platform health & service status</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] hover:bg-[#A0760A] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm">
            <p className="text-xs text-[#9A8F82] font-semibold uppercase tracking-wider mb-2">Total Services</p>
            <p className="text-3xl font-black text-[#1C1712]">{services.length}</p>
            <p className="text-[10px] text-[#9A8F82] mt-2">Monitored</p>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-sm">
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-2">Operational</p>
            <p className="text-3xl font-black text-emerald-600">{upServices}</p>
            <p className="text-[10px] text-emerald-600 mt-2">Services up</p>
          </div>

          <div className={`rounded-2xl border p-4 shadow-sm ${downServices > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${downServices > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Down</p>
            <p className={`text-3xl font-black ${downServices > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{downServices}</p>
            <p className={`text-[10px] mt-2 ${downServices > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Services {downServices > 0 ? 'down' : 'healthy'}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm">
            <p className="text-xs text-[#9A8F82] font-semibold uppercase tracking-wider mb-2">Avg Response</p>
            <p className="text-3xl font-black text-[#1C1712]">{avgResponseTime}ms</p>
            <p className="text-[10px] text-[#9A8F82] mt-2">Response time</p>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE0] bg-gradient-to-r from-[#FFFBEF] to-[#FEFCF8]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Server size={15} className="text-[#B8860B]" />
              </div>
              <div>
                <h2 className="font-serif text-sm font-bold text-[#1C1712]">Service Status</h2>
                <p className="text-[10px] text-[#9A8F82]">All services monitored</p>
              </div>
            </div>
            {lastRefresh && (
              <p className="text-[10px] text-[#9A8F82]">
                Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {services.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Database size={32} className="mx-auto text-[#D3CBBB] mb-3" />
              <p className="text-[#9A8F82] text-sm">No services monitored yet</p>
              <p className="text-[#D3CBBB] text-xs mt-1">Services will appear here once monitoring starts</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {services.map(service => {
                const colors = getStatusColor(service.status)
                return (
                  <div key={service.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#FFFBEF] transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                        <span className={`w-2 h-2 rounded-full ${colors.dot} ${service.is_healthy ? 'animate-pulse' : ''}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                          {service.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1C1712] capitalize">{service.service_name}</p>
                        <p className="text-xs text-[#9A8F82] mt-0.5">Response: {service.response_time_ms}ms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs font-semibold text-[#1C1712]">
                          {service.is_healthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </p>
                        <p className="text-[10px] text-[#9A8F82] mt-0.5">
                          {new Date(service.checked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {service.is_healthy ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <AlertTriangle size={18} className="text-red-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-red-700">System Alerts</h2>
              <p className="text-[10px] text-red-400">{alerts.length} recent alerts</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle size={32} className="mx-auto text-emerald-300 mb-3" />
              <p className="text-[#9A8F82] text-sm">No alerts at the moment</p>
              <p className="text-[#D3CBBB] text-xs mt-1">All systems are operating normally</p>
            </div>
          ) : (
            <div className="divide-y divide-red-50">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-4 px-6 py-4 hover:bg-red-50/50 transition-colors">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                    {alert.severity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1C1712]">{alert.service}</p>
                    <p className="text-xs text-[#666] mt-1">{alert.message}</p>
                    <p className="text-[10px] text-[#9A8F82] mt-2">
                      {new Date(alert.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}