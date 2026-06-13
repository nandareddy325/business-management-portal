// app/(super-admin)/admin/dashboard/page.tsx
import { adminClientService } from '@/services'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Building2, Users, TrendingUp, CreditCard,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'

async function getDashboardData() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalTenants },
    { count: activeSubscriptions },
    { count: trialTenants },
    { count: totalUsers },
    { count: totalLeads },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('plan_status', 'active'),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('plan_status', 'trial'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
  ])

  // MRR — only active subscriptions
  const { data: activePlans } = await supabase
    .from('companies')
    .select('plan:plans(price_monthly)')
    .eq('plan_status', 'active')

  const mrr = activePlans?.reduce((sum: number, c: any) => sum + Number(c.plan?.price_monthly ?? 0), 0) ?? 0

  // Recent tenants
  const { data: recentTenants } = await supabase
    .from('companies')
    .select('id, name, plan_status, created_at, plan:plans(name)')
    .order('created_at', { ascending: false })
    .limit(6)

  return { totalTenants, activeSubscriptions, trialTenants, totalUsers, totalLeads, mrr, recentTenants }
}

const KPICard = ({ title, value, sub, icon: Icon, trend, color }: any) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </div>
)

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  trial: 'bg-amber-500/10 text-amber-400',
  expired: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-gray-500/10 text-gray-400',
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time overview of GK CRM platform</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Tenants"
          value={data.totalTenants ?? 0}
          sub={`${data.trialTenants ?? 0} on trial`}
          icon={Building2}
          color="bg-blue-500/10 text-blue-400"
          trend={12}
        />
        <KPICard
          title="Active Subscriptions"
          value={data.activeSubscriptions ?? 0}
          sub="Paying customers"
          icon={CreditCard}
          color="bg-emerald-500/10 text-emerald-400"
          trend={8}
        />
        <KPICard
          title="Monthly Revenue"
          value={`₹${((data.mrr ?? 0) / 1000).toFixed(1)}K`}
          sub="MRR — active plans only"
          icon={TrendingUp}
          color="bg-amber-500/10 text-amber-400"
          trend={15}
        />
        <KPICard
          title="Total Users"
          value={data.totalUsers ?? 0}
          sub={`Across ${data.totalTenants} companies`}
          icon={Users}
          color="bg-purple-500/10 text-purple-400"
          trend={6}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Leads</p>
            <p className="text-lg font-bold text-white">{(data.totalLeads ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Trial Companies</p>
            <p className="text-lg font-bold text-white">{data.trialTenants ?? 0}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Trial Conversion</p>
            <p className="text-lg font-bold text-white">
              {data.totalTenants
                ? Math.round(((data.activeSubscriptions ?? 0) / data.totalTenants) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Recent Tenants</h2>
          <a href="/admin/tenants" className="text-xs text-amber-400 hover:text-amber-300">View all →</a>
        </div>
        <div className="divide-y divide-gray-800">
          {(data.recentTenants ?? []).map((tenant: any) => (
            <div key={tenant.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-white">{tenant.name}</p>
                <p className="text-xs text-gray-500">{tenant.plan?.name ?? 'No plan'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[tenant.plan_status] ?? statusColors.expired}`}>
                  {tenant.plan_status}
                </span>
                <p className="text-xs text-gray-600">
                  {new Date(tenant.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          ))}
          {!data.recentTenants?.length && (
            <p className="text-center text-gray-600 text-sm py-8">No tenants yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
