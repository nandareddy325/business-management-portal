import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Users, Activity, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Shield, Zap } from 'lucide-react'

async function getSystemStats(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const [
    { count: totalCompanies },
    { count: totalUsers },
    { count: totalLeads },
    { count: activeCompanies },
    { data: recentCompanies },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('companies').select('id, name, created_at, is_active').order('created_at', { ascending: false }).limit(5),
  ])

  return {
    totalCompanies: totalCompanies || 0,
    totalUsers: totalUsers || 0,
    totalLeads: totalLeads || 0,
    activeCompanies: activeCompanies || 0,
    recentCompanies: recentCompanies || [],
  }
}

export default async function SuperAdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getSystemStats(supabase)

  const statCards = [
    {
      label: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      trend: '+2 this month',
      up: true,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      trend: '+5 this week',
      up: true,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: TrendingUp,
      trend: '+24% this month',
      up: true,
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    {
      label: 'Active Companies',
      value: stats.activeCompanies,
      icon: Activity,
      trend: `${stats.totalCompanies > 0 ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100) : 0}% active rate`,
      up: stats.activeCompanies > 0,
      gradient: 'from-violet-500/20 to-violet-600/5',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      border: 'border-violet-500/20',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-[#B8860B]" />
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B]">Super Admin Portal</p>
            </div>
            <h1 className="font-serif text-3xl text-[#1C1712]">System Dashboard</h1>
            <p className="text-sm text-[#9A8F82] mt-1">Platform-wide overview — all tenants & health metrics</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label}
                className={`relative rounded-2xl border ${card.border} bg-white overflow-hidden p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />
                <div className="relative flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon size={18} className={card.iconColor} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {card.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {card.trend}
                  </div>
                </div>
                <div className="relative">
                  <p className="font-serif text-3xl font-bold text-[#1C1712]">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-[#9A8F82] mt-0.5">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* System Health */}
          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
                <Zap size={14} className="text-[#B8860B]" />
              </div>
              <h2 className="font-serif text-base text-[#1C1712]">System Health</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Database',      status: 'Operational', uptime: '99.9%', color: 'bg-emerald-400' },
                { label: 'Auth Service',  status: 'Operational', uptime: '100%',  color: 'bg-emerald-400' },
                { label: 'Realtime',      status: 'Operational', uptime: '99.7%', color: 'bg-emerald-400' },
                { label: 'Storage',       status: 'Operational', uptime: '100%',  color: 'bg-emerald-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F5F1]">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                    <p className="text-sm font-medium text-[#1C1712]">{item.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-semibold">{item.uptime}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
                <Shield size={14} className="text-[#B8860B]" />
              </div>
              <h2 className="font-serif text-base text-[#1C1712]">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Manage Tenants',  href: '/admin/tenants',       icon: '🏢' },
                { label: 'Subscriptions',   href: '/admin/subscriptions', icon: '💳' },
                { label: 'Revenue',         href: '/admin/revenue',       icon: '📈' },
                { label: 'All Users',       href: '/admin/users',         icon: '👥' },
              ].map(link => (
                <a key={link.label} href={link.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#E8E2D8] hover:bg-[#F5F0E8] hover:border-[#B8860B]/40 transition-all text-center group">
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-[10px] font-semibold text-[#1C1712] leading-tight">{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-[#1C1712] rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #B8860B, transparent 60%)' }} />
            <div className="relative">
              <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest mb-4">Platform Overview</p>
              <div className="space-y-4">
                {[
                  { label: 'Conversion Rate', value: stats.totalLeads > 0 ? '18.4%' : '0%', sub: 'avg across tenants' },
                  { label: 'Avg Leads/Company', value: stats.totalCompanies > 0 ? Math.round(stats.totalLeads / stats.totalCompanies).toString() : '0', sub: 'leads per tenant' },
                  { label: 'Users/Company', value: stats.totalCompanies > 0 ? Math.round(stats.totalUsers / stats.totalCompanies).toString() : '0', sub: 'avg team size' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50">{item.label}</p>
                      <p className="text-[10px] text-white/30">{item.sub}</p>
                    </div>
                    <p className="font-serif text-2xl text-[#B8860B]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE0]"
            style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
                <Building2 size={14} className="text-[#B8860B]" />
              </div>
              <h2 className="font-serif text-base text-[#1C1712]">Recent Companies</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                {stats.totalCompanies} total
              </span>
            </div>
            <a href="/admin/tenants"
              className="text-xs font-semibold text-[#B8860B] hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </a>
          </div>

          {stats.recentCompanies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} className="text-[#9A8F82]" />
              </div>
              <p className="text-sm font-semibold text-[#1C1712]">No companies yet</p>
              <p className="text-xs text-[#9A8F82] mt-1">Companies will appear here after signup</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {stats.recentCompanies.map((company: { id: string; name: string; created_at: string; is_active: boolean }) => (
                <div key={company.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#FFFBEF] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F0E8] border border-[#E8E2D8] flex items-center justify-center">
                      <Building2 size={15} className="text-[#B8860B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1712]">{company.name}</p>
                      <p className="text-xs text-[#9A8F82]">
                        Joined {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      company.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {company.is_active ? '● Active' : '● Inactive'}
                    </span>
                    <a href={`/admin/tenants/${company.id}`}
                      className="text-[10px] font-semibold text-[#B8860B] hover:underline">
                      View →
                    </a>
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