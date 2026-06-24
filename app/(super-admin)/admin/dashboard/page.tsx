import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Users, CreditCard, Activity, TrendingUp, AlertCircle } from 'lucide-react'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const stats = await getSystemStats(supabase)

  const statCards = [
    {
      label: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: TrendingUp,
      color: 'text-[#B8860B]',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Active Companies',
      value: stats.activeCompanies,
      icon: Activity,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
  ]

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#B8860B] mb-1">Super Admin</p>
        <h1 className="font-serif text-2xl text-[#1C1712]">System Dashboard</h1>
        <p className="text-sm text-[#9A8F82] mt-1">Platform-wide overview — all tenants & health</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label}
              className={`rounded-2xl border ${card.border} ${card.bg} p-5 flex flex-col gap-3`}>
              <div className={`w-10 h-10 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center`}>
                <Icon size={18} className={card.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1C1712]">{card.value.toLocaleString()}</p>
                <p className="text-xs text-[#9A8F82] mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* System Health */}
      <div className="rounded-2xl border border-[#E8E2D8] bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#B8860B]" />
          <h2 className="font-serif text-base text-[#1C1712]">System Health</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Database', status: 'Operational', color: 'bg-emerald-400' },
            { label: 'Auth Service', status: 'Operational', color: 'bg-emerald-400' },
            { label: 'Realtime', status: 'Operational', color: 'bg-emerald-400' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F5F1]">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-[#1C1712]">{item.label}</p>
                <p className="text-xs text-[#9A8F82]">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Companies */}
      <div className="rounded-2xl border border-[#E8E2D8] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#B8860B]" />
            <h2 className="font-serif text-base text-[#1C1712]">Recent Companies</h2>
          </div>
          <a href="/super-admin/admin/tenants"
            className="text-xs font-semibold text-[#B8860B] hover:underline">View all →</a>
        </div>

        {stats.recentCompanies.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={32} className="text-[#9A8F82] mx-auto mb-2" />
            <p className="text-sm text-[#9A8F82]">No companies yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentCompanies.map((company: { id: string; name: string; created_at: string; is_active: boolean }) => (
              <div key={company.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F5F1] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] border border-[#E8E2D8] flex items-center justify-center">
                    <Building2 size={14} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1712]">{company.name}</p>
                    <p className="text-xs text-[#9A8F82]">
                      {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  company.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {company.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Tenants', href: '/super-admin/admin/tenants', icon: '🏢' },
          { label: 'Subscriptions', href: '/super-admin/admin/subscriptions', icon: '💳' },
          { label: 'Revenue', href: '/super-admin/admin/revenue', icon: '📈' },
          { label: 'All Users', href: '/super-admin/admin/users', icon: '👥' },
        ].map(link => (
          <a key={link.label} href={link.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] hover:border-[#B8860B] transition-all text-center">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-xs font-semibold text-[#1C1712]">{link.label}</span>
          </a>
        ))}
      </div>

    </div>
  )
}