// app/(super-admin)/admin/revenue/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrendingUp, IndianRupee, AlertCircle, ArrowUpRight } from 'lucide-react'

async function getRevenueData() {
  const supabase = await createServerSupabaseClient()
  
  // Get plan breakdown with active subscriptions
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

  // Get recent active subscribers
  const { data: recentPayments } = await supabase
    .from('companies')
    .select('id, name, plan:plans(name, price_monthly), plan_status, subscription_id')
    .eq('plan_status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  // Get churned count
  const { count: churnedCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .in('plan_status', ['cancelled', 'expired'])

  return { planStats, mrr, arr, recentPayments, churnedCount }
}

export default async function AdminRevenuePage() {
  const { planStats, mrr, arr, recentPayments, churnedCount } = await getRevenueData()

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Super Admin</p>
          <h1 className="font-serif text-3xl text-[#1C1712]">Revenue Dashboard</h1>
          <p className="text-sm text-[#9A8F82] mt-1">Monthly & annual recurring revenue breakdown</p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              label: 'MRR', 
              sub: 'Monthly Recurring Revenue', 
              value: `₹${mrr.toLocaleString('en-IN')}`, 
              icon: IndianRupee, 
              iconBg: 'bg-emerald-50', 
              iconColor: 'text-emerald-600', 
              border: 'border-emerald-100' 
            },
            { 
              label: 'ARR', 
              sub: 'Annual Recurring Revenue', 
              value: `₹${(arr / 100000).toFixed(1)}L`, 
              icon: TrendingUp, 
              iconBg: 'bg-amber-50', 
              iconColor: 'text-[#B8860B]', 
              border: 'border-amber-100' 
            },
            { 
              label: 'Churned', 
              sub: 'Cancelled / Expired', 
              value: String(churnedCount ?? 0), 
              icon: AlertCircle, 
              iconBg: 'bg-red-50', 
              iconColor: 'text-red-500', 
              border: 'border-red-100' 
            },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon size={16} className={card.iconColor} />
                  </div>
                  <p className="text-xs font-bold text-[#9A8F82] uppercase tracking-wider">{card.label}</p>
                </div>
                <p className="font-serif text-3xl font-bold text-[#1C1712]">{card.value}</p>
                <p className="text-xs text-[#9A8F82] mt-1">{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Plan Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">Revenue by Plan</h2>
            <p className="text-xs text-[#9A8F82] mt-0.5">Active subscriptions breakdown</p>
          </div>
          <div className="p-6 space-y-5">
            {Object.values(planStats).length > 0 ? (
              Object.values(planStats).map((plan) => (
                <div key={plan.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#F5F0E8] text-[#B8860B] border border-[#E8DCC8] capitalize">
                        {plan.name}
                      </span>
                      <span className="text-xs text-[#9A8F82]">{plan.count} companies</span>
                    </div>
                    <span className="text-sm font-bold text-[#1C1712]">₹{plan.mrr.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="h-2 bg-[#F5F0E8] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#B8860B] to-amber-400 rounded-full transition-all"
                      style={{ width: `${mrr > 0 ? (plan.mrr / mrr) * 100 : 0}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-[#9A8F82]">
                      {mrr > 0 ? ((plan.mrr / mrr) * 100).toFixed(1) : 0}% of total MRR
                    </span>
                    <span className="text-[10px] font-mono text-[#B8860B]">
                      ₹{(plan.mrr * 12).toLocaleString('en-IN')}/yr
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#9A8F82]">No active subscriptions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Subscribers Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">Active Subscribers</h2>
            <p className="text-xs text-[#9A8F82] mt-0.5">{recentPayments?.length ?? 0} active subscriptions</p>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {(recentPayments ?? []).length > 0 ? (
              (recentPayments ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#FFFBEF] transition-colors group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F0E8] border border-[#E8E2D8] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#B8860B]">{c.name?.[0]?.toUpperCase() ?? 'C'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1C1712]">{c.name ?? 'Unknown Company'}</p>
                      <p className="text-xs text-[#9A8F82] capitalize">{c.plan?.name ?? 'Unknown'} plan</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600">₹{Number(c.plan?.price_monthly ?? 0).toLocaleString('en-IN')}/mo</p>
                    <p className="text-[10px] text-[#B8B0A0] font-mono mt-0.5">{c.subscription_id ? c.subscription_id.substring(0, 12) + '...' : 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-[#9A8F82]">No active subscribers</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Summary Stats */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-6">
          <h2 className="font-serif text-base text-[#1C1712] mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Companies', value: String((recentPayments?.length ?? 0) + (churnedCount ?? 0)) },
              { label: 'Active Subscriptions', value: String(recentPayments?.length ?? 0) },
              { label: 'Avg Plan Value', value: `₹${mrr > 0 && planStats ? (mrr / Object.values(planStats).reduce((s, p) => s + p.count, 0)).toFixed(0) : 0}` },
              { label: 'Annual Revenue Potential', value: `₹${(arr / 100000).toFixed(1)}L` },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-[#FFFBEF] border border-[#F0EBE0]">
                <p className="text-xs font-bold text-[#9A8F82] uppercase mb-2">{stat.label}</p>
                <p className="font-bold text-[#1C1712] text-lg">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}