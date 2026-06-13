// app/(super-admin)/admin/revenue/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrendingUp, IndianRupee, CreditCard, AlertCircle } from 'lucide-react'

async function getRevenueData() {
  const supabase = await createServerSupabaseClient()

  // Per-plan breakdown
  const { data: planBreakdown } = await supabase
    .from('companies')
    .select('plan_status, plan:plans(name, price_monthly, price_yearly)')
    .eq('plan_status', 'active')

  const planStats: Record<string, { count: number; mrr: number; name: string }> = {}
  for (const c of planBreakdown ?? []) {
    const planName = (c.plan as any)?.name ?? 'unknown'
    const price = Number((c.plan as any)?.price_monthly ?? 0)
    if (!planStats[planName]) planStats[planName] = { count: 0, mrr: 0, name: planName }
    planStats[planName].count++
    planStats[planName].mrr += price
  }

  const mrr = Object.values(planStats).reduce((s, p) => s + p.mrr, 0)
  const arr = mrr * 12

  // Recent payments (from invoices table if exists, else mock structure)
  const { data: recentPayments } = await supabase
    .from('companies')
    .select('id, name, plan:plans(name, price_monthly), plan_status, subscription_id')
    .eq('plan_status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  // Expired / churned
  const { count: churnedCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .in('plan_status', ['cancelled', 'expired'])

  return { planStats, mrr, arr, recentPayments, churnedCount }
}

const planColors: Record<string, string> = {
  starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  professional: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  business: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  enterprise: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default async function AdminRevenuePage() {
  const { planStats, mrr, arr, recentPayments, churnedCount } = await getRevenueData()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Revenue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monthly & annual recurring revenue breakdown</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">MRR</p>
          </div>
          <p className="text-3xl font-bold text-white">₹{mrr.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ARR</p>
          </div>
          <p className="text-3xl font-bold text-white">₹{(arr / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">Annual Recurring Revenue</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Churned</p>
          </div>
          <p className="text-3xl font-bold text-white">{churnedCount ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Cancelled / Expired</p>
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Revenue by Plan</h2>
        </div>
        <div className="p-5 space-y-4">
          {Object.values(planStats).map((plan) => (
            <div key={plan.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border capitalize ${planColors[plan.name] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {plan.name}
                  </span>
                  <span className="text-xs text-gray-500">{plan.count} companies</span>
                </div>
                <span className="text-sm font-semibold text-white">₹{plan.mrr.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${mrr > 0 ? (plan.mrr / mrr) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(planStats).length === 0 && (
            <p className="text-center text-gray-600 text-sm py-6">No active subscriptions yet</p>
          )}
        </div>
      </div>

      {/* Active Subscribers */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Active Subscribers</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {(recentPayments ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-gray-500 capitalize">{c.plan?.name ?? '—'} plan</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">
                  ₹{Number(c.plan?.price_monthly ?? 0).toLocaleString('en-IN')}/mo
                </p>
                <p className="text-[10px] text-gray-600 font-mono">{c.subscription_id ?? '—'}</p>
              </div>
            </div>
          ))}
          {!recentPayments?.length && (
            <p className="text-center text-gray-600 text-sm py-8">No active subscribers</p>
          )}
        </div>
      </div>
    </div>
  )
}
