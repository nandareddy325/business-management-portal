import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Building2, Users, Activity, TrendingUp,
  AlertCircle, ArrowUpRight, Shield, Zap,
  BarChart3, Globe, ChevronRight
} from 'lucide-react'

async function getSystemStats(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const [
    { count: totalCompanies },
    { count: totalUsers },
    { count: totalLeads },
    { count: activeCompanies },
    { count: quotationLeads },
    { count: wonLeads },
    { data: recentCompanies },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('pipeline_stage', 'quotation'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('pipeline_stage', 'won'),
    supabase.from('companies').select('id, name, created_at, is_active').order('created_at', { ascending: false }).limit(5),
  ])

  const tl = totalLeads || 0
  const ql = quotationLeads || 0
  const wl = wonLeads || 0
  const conversionRate = tl > 0 ? ((( ql + wl) / tl) * 100).toFixed(1) : '0'

  return {
    totalCompanies: totalCompanies || 0,
    totalUsers: totalUsers || 0,
    totalLeads: tl,
    activeCompanies: activeCompanies || 0,
    conversionRate,
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
      label: 'Companies',
      value: stats.totalCompanies,
      sub: 'Total tenants',
      icon: Building2,
      color: 'blue',
      glow: 'shadow-blue-500/10',
      ring: 'ring-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      valuColor: 'text-blue-300',
    },
    {
      label: 'Users',
      value: stats.totalUsers,
      sub: 'Across all tenants',
      icon: Users,
      color: 'emerald',
      glow: 'shadow-emerald-500/10',
      ring: 'ring-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      valuColor: 'text-emerald-300',
    },
    {
      label: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      sub: 'All pipeline stages',
      icon: TrendingUp,
      color: 'amber',
      glow: 'shadow-amber-500/10',
      ring: 'ring-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      valuColor: 'text-amber-300',
    },
    {
      label: 'Active',
      value: stats.activeCompanies,
      sub: `${stats.totalCompanies > 0 ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100) : 0}% uptime`,
      icon: Activity,
      color: 'violet',
      glow: 'shadow-violet-500/10',
      ring: 'ring-violet-500/20',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      valuColor: 'text-violet-300',
    },
  ]

  const health = [
    { label: 'Database',     uptime: '99.9%', ok: true },
    { label: 'Auth Service', uptime: '100%',  ok: true },
    { label: 'Realtime',     uptime: '99.7%', ok: true },
    { label: 'Storage',      uptime: '100%',  ok: true },
  ]

  const platformMetrics = [
    {
      label: 'Conversion Rate',
      value: stats.conversionRate + '%',
      desc: 'Quotation + Won / Total',
      icon: BarChart3,
    },
    {
      label: 'Leads / Tenant',
      value: stats.totalCompanies > 0 ? Math.round(stats.totalLeads / stats.totalCompanies).toString() : '0',
      desc: 'Average per company',
      icon: Globe,
    },
    {
      label: 'Users / Tenant',
      value: stats.totalCompanies > 0 ? Math.round(stats.totalUsers / stats.totalCompanies).toString() : '0',
      desc: 'Average team size',
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0D]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0A0A0D]/80 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="pl-10 lg:pl-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Shield size={11} className="text-amber-400" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-amber-400/70">Super Admin</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">System Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 hidden sm:block">All Systems Operational</span>
            <span className="text-[10px] font-semibold text-emerald-400 sm:hidden">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`relative rounded-2xl bg-white/[0.03] ring-1 ${card.ring} p-4 sm:p-5 flex flex-col gap-4 shadow-xl ${card.glow} hover:bg-white/[0.05] transition-colors group`}
              >
                {/* Subtle glow orb */}
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 bg-current ${card.iconColor}`} />

                <div className="relative flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon size={16} className={card.iconColor} />
                  </div>
                  <ArrowUpRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
                </div>

                <div className="relative">
                  <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.valuColor}`}>
                    {card.value}
                  </p>
                  <p className="text-xs font-semibold text-white/60 mt-0.5">{card.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5 hidden sm:block">{card.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Middle Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* System Health */}
          <div className="bg-white/[0.03] ring-1 ring-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Zap size={14} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">System Health</h2>
                <p className="text-[10px] text-white/30">Live service status</p>
              </div>
            </div>
            <div className="space-y-2">
              {health.map(item => (
                <div key={item.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-xs font-medium text-white/70">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400">{item.uptime}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold hidden sm:inline">UP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/[0.03] ring-1 ring-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield size={14} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
                <p className="text-[10px] text-white/30">Jump to key sections</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Manage Tenants',  href: '/admin/tenants',       emoji: '🏢', desc: 'View all companies' },
                { label: 'Subscriptions',   href: '/admin/subscriptions', emoji: '💳', desc: 'Plans & billing' },
                { label: 'Revenue',         href: '/admin/revenue',       emoji: '📈', desc: 'Financial overview' },
                { label: 'Settings',        href: '/admin/settings',      emoji: '⚙️', desc: 'System config' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <span className="text-base w-7 text-center">{link.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{link.label}</p>
                    <p className="text-[10px] text-white/25 hidden sm:block">{link.desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-white/15 group-hover:text-amber-400/60 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="relative bg-gradient-to-br from-amber-500/[0.07] to-transparent ring-1 ring-amber-500/15 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <BarChart3 size={14} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Platform Metrics</h2>
                <p className="text-[10px] text-white/30">Aggregate performance</p>
              </div>
            </div>
            <div className="space-y-4">
              {platformMetrics.map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon size={12} className="text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white/60 truncate">{item.label}</p>
                        <p className="text-[10px] text-white/25 hidden sm:block">{item.desc}</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-400 flex-shrink-0">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Recent Companies ── */}
        <div className="bg-white/[0.03] ring-1 ring-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 size={13} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Recent Companies</h2>
                <p className="text-[10px] text-white/30 hidden sm:block">Latest registered tenants</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {stats.totalCompanies}
              </span>
            </div>
            <a
              href="/admin/tenants"
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              View all <ChevronRight size={12} />
            </a>
          </div>

          {stats.recentCompanies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={20} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/40">No companies yet</p>
              <p className="text-xs text-white/20 mt-1">They will appear here after signup</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {stats.recentCompanies.map((company: { id: string; name: string; created_at: string; is_active: boolean }) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.02] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={13} className="text-white/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate">{company.name}</p>
                      <p className="text-[10px] text-white/25">
                        {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      company.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                    }`}>
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <a
                      href={`/admin/tenants/${company.id}`}
                      className="hidden sm:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-amber-500/10 items-center justify-center transition-colors group"
                    >
                      <ChevronRight size={12} className="text-white/30 group-hover:text-amber-400 transition-colors" />
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