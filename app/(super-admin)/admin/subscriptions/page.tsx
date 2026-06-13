// app/(super-admin)/admin/subscriptions/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreditCard, Clock, XCircle, CheckCircle } from 'lucide-react'

async function getSubscriptionData() {
  const supabase = await createServerSupabaseClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*, plan:plans(name, price_monthly, price_yearly)')
    .order('created_at', { ascending: false })

  const grouped = {
    active: [] as any[],
    trial: [] as any[],
    expired: [] as any[],
    cancelled: [] as any[],
  }

  for (const c of companies ?? []) {
    const status = c.plan_status as keyof typeof grouped
    if (grouped[status]) grouped[status].push(c)
  }

  return grouped
}

const tabs = [
  { key: 'active', label: 'Active', icon: CheckCircle, color: 'text-emerald-400' },
  { key: 'trial', label: 'Trial', icon: Clock, color: 'text-amber-400' },
  { key: 'expired', label: 'Expired', icon: XCircle, color: 'text-red-400' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-gray-400' },
]

const planColors: Record<string, string> = {
  starter: 'text-blue-400',
  professional: 'text-purple-400',
  business: 'text-amber-400',
  enterprise: 'text-emerald-400',
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const grouped = await getSubscriptionData()
  const activeTab = (searchParams.tab ?? 'active') as keyof typeof grouped

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">All company subscription statuses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <a key={key} href={`?tab=${key}`}
            className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
              activeTab === key ? 'border-amber-500/50' : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{grouped[key as keyof typeof grouped].length}</p>
          </a>
        ))}
      </div>

      {/* List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white capitalize">{activeTab} Subscriptions</h2>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 px-5 py-3 border-b border-gray-800">
          {tabs.map(({ key, label }) => (
            <a key={key} href={`?tab=${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label} ({grouped[key as keyof typeof grouped].length})
            </a>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                {activeTab === 'trial' ? 'Trial Ends' : 'Since'}
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Sub ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {grouped[activeTab].map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium capitalize ${planColors[c.plan?.name] ?? 'text-gray-400'}`}>
                    {c.plan?.name ?? '—'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {c.plan?.price_monthly
                    ? <span className="text-sm text-white">₹{Number(c.plan.price_monthly).toLocaleString('en-IN')}/mo</span>
                    : <span className="text-sm text-gray-600">—</span>
                  }
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {activeTab === 'trial' && c.trial_ends_at
                    ? new Date(c.trial_ends_at).toLocaleDateString('en-IN')
                    : new Date(c.created_at).toLocaleDateString('en-IN')
                  }
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-mono text-gray-600">{c.subscription_id ?? '—'}</span>
                </td>
              </tr>
            ))}
            {!grouped[activeTab].length && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-600 text-sm">
                  No {activeTab} subscriptions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
