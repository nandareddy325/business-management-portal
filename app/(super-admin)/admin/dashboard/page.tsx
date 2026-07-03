// app/(super-admin)/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, CreditCard, Building2, Zap, Clock, AlertCircle, Activity, RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface DashboardStats {
  totalRevenue: number
  totalUsers: number
  activeSubscriptions: number
  growthRate: number
  totalCompanies: number
  activeUsers: number
  monthlyRevenue: number
  avgResponseTime: number
  activeAlerts: number
  systemHealth: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    timestamp: string
    icon: string
  }>
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    growthRate: 0,
    totalCompanies: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    avgResponseTime: 0,
    activeAlerts: 0,
    systemHealth: 0,
    recentActivity: []
  })
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // === FETCH COMPANIES ===
      const { data: companies } = await supabase
        .from('companies')
        .select('*')

      const totalCompanies = companies?.length || 0
      const activeCompanies = companies?.filter((c: any) => c.plan_status?.toLowerCase() === 'active').length || 0

      // === FETCH USERS ===
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')

      const totalUsers = profiles?.length || 0
      const activeUsers = profiles?.filter((p: any) => p.is_active === true).length || 0

      // === FETCH SUBSCRIPTIONS ===
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')

      const activeSubscriptions = subscriptions?.length || 0

      // === FETCH SYSTEM STATUS ===
      const { data: systemStatus } = await supabase
        .from('system_status')
        .select('is_healthy, response_time_ms')

      const totalServices = systemStatus?.length || 0
      const healthyServices = systemStatus?.filter((s: any) => s.is_healthy === true).length || 0
      const systemHealth = totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0
      const avgResponseTime = systemStatus && systemStatus.length > 0
        ? Math.round(systemStatus.reduce((sum: number, s: any) => sum + (s.response_time_ms || 0), 0) / systemStatus.length)
        : 0

      // === FETCH ALERTS ===
      const { data: alerts } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)

      const activeAlerts = alerts?.length || 0

      // === CALCULATE REVENUE ===
      // Assuming monthly revenue = active subscriptions * average plan price (₹45,000)
      const avgPlanPrice = 45000
      const monthlyRevenue = activeSubscriptions * avgPlanPrice
      const totalRevenue = monthlyRevenue * 12 // Approximate annual

      // === GROWTH RATE ===
      // Simple calculation: (active companies / total companies) * 100
      const growthRate = totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0

      // === RECENT ACTIVITY ===
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      const activityMap: { [key: string]: string } = {
        'company_created': '📊 New company registered',
        'user_joined': '👥 New user joined',
        'payment_received': '💳 Payment processed successfully',
        'backup_completed': '💾 System backup completed',
        'ticket_created': '🎫 New support ticket created',
        'email_sent': '📧 Email sent',
        'settings_updated': '⚙️ Settings updated',
        'system_health_check': '🏥 System health check'
      }

      const recentActivity = (auditLogs || []).map((log: any) => {
        const actionLabel = activityMap[log.action_type] || `📌 ${log.action}`
        const [icon, title] = actionLabel.split(' ')
        
        return {
          id: log.id,
          type: log.action_type,
          title: title || log.action,
          timestamp: new Date(log.created_at).toLocaleString('en-IN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          icon: icon || '📌'
        }
      })

      setStats({
        totalRevenue,
        totalUsers,
        activeSubscriptions,
        growthRate,
        totalCompanies,
        activeUsers,
        monthlyRevenue,
        avgResponseTime,
        activeAlerts,
        systemHealth,
        recentActivity
      })

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'L'
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE8DE 100%)' }}>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-[#B8860B] flex items-center justify-center">
                <BarChart3 size={11} className="text-white" />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B]">Dashboard</p>
            </div>
            <h1 className="font-serif text-3xl text-[#1C1712]">Admin Overview</h1>
            <p className="text-sm text-[#9A8F82] mt-1">Welcome back! Here's your system overview.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] hover:bg-[#A0760A] text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Top Stats Row - 4 Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${formatNumber(stats.totalRevenue)}`, icon: BarChart3, color: '#F59E0B', bg: 'from-amber-500/10 to-amber-500/5' },
            { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: '#60A5FA', bg: 'from-blue-500/10 to-blue-500/5' },
            { label: 'Active Subscriptions', value: stats.activeSubscriptions.toString(), icon: CreditCard, color: '#34D399', bg: 'from-emerald-500/10 to-emerald-500/5' },
            { label: 'Growth Rate', value: `${stats.growthRate}%`, icon: TrendingUp, color: '#A78BFA', bg: 'from-violet-500/10 to-violet-500/5' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className={`rounded-2xl border border-[#E8E2D8] bg-white overflow-hidden shadow-sm bg-gradient-to-br ${stat.bg} p-6`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A8F82] mb-2">{stat.label}</p>
                    <p className="text-2xl font-black text-[#1C1712]">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white" style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Secondary Stats Row - 6 Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Companies', value: stats.totalCompanies.toString(), icon: Building2, color: '#60A5FA' },
            { label: 'Active Users', value: stats.activeUsers.toString(), icon: Users, color: '#F59E0B' },
            { label: 'Monthly Revenue', value: `₹${formatNumber(stats.monthlyRevenue)}`, icon: BarChart3, color: '#34D399' },
            { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, icon: Clock, color: '#A78BFA' },
            { label: 'Active Alerts', value: stats.activeAlerts.toString(), icon: AlertCircle, color: stats.activeAlerts > 0 ? '#EF4444' : '#34D399' },
            { label: 'System Health', value: `${stats.systemHealth}%`, icon: Activity, color: stats.systemHealth >= 80 ? '#34D399' : stats.systemHealth >= 50 ? '#F59E0B' : '#EF4444' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="rounded-2xl border border-[#E8E2D8] bg-white overflow-hidden shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A8F82] mb-2">{stat.label}</p>
                    <p className="text-2xl font-black text-[#1C1712]">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
              <Activity size={15} className="text-[#B8860B]" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-sm font-bold text-[#1C1712]">Recent Activity</h2>
              <p className="text-[10px] text-[#9A8F82]">Latest system events</p>
            </div>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[#9A8F82] text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FFFBEF] transition-colors">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1C1712]">{activity.title}</p>
                  </div>
                  <p className="text-[10px] text-[#9A8F82]">{activity.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Updated */}
        {lastRefresh && (
          <p className="text-[10px] text-[#9A8F82] text-center">
            Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

      </div>
    </div>
  )
}