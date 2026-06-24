import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreditCard, Clock, XCircle, CheckCircle } from 'lucide-react'

async function getSubscriptionData() {
  const supabase = await createServerSupabaseClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*, plan:plans(name, price_monthly, price_yearly)')
    .order('created_at', { ascending: false })

  const grouped = { active: [] as any[], trial: [] as any[], expired: [] as any[], cancelled: [] as any[] }
  for (const c of companies ?? []) {
    const status = c.plan_status as keyof typeof grouped
    if (grouped[status]) grouped[status].push(c)
  }
  return grouped
}

const tabs = [
  { key: 'active',    label: 'Active',    icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'trial',     label: 'Trial',     icon: Clock,       color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { key: 'expired',   label: 'Expired',   icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle,     color: 'text-[#9A8F82]',   bg: 'bg-[#F5F0E8]', border: 'border-[#E8E2D8]' },
]

const planColors: Record<string, string> = {
  starter: 'text-blue-600 bg-blue-50',
  professional: 'text-violet-600 bg-violet-50',
  business: 'text-[#B8860B] bg-amber-50',
  enterprise: 'text-emerald-600 bg-emerald-50',
}

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const grouped = await getSubscriptionData()
  const activeTab = (searchParams.tab ?? 'active') as keyof typeof grouped

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Super Admin</p>
          <h1 className="font-serif text-3xl text-[#1C1712]">Subscriptions</h1>
          <p className="text-sm text-[#9A8F82] mt-1">All company subscription statuses</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tabs.map(({ key, label, icon: Icon, color, bg, border }) => (
            <a key={key} href={`?tab=${key}`}
              className={`bg-white rounded-2xl border ${activeTab === key ? 'border-[#B8860B] shadow-md' : border} p-4 transition-all hover:shadow-sm`}>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="font-serif text-2xl font-bold text-[#1C1712]">{grouped[key as keyof typeof grouped].length}</p>
              <p className="text-xs text-[#9A8F82] mt-0.5">{label}</p>
            </a>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="flex gap-1">
              {tabs.map(({ key, label }) => (
                <a key={key} href={`?tab=${key}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === key
                      ? 'bg-[#1C1712] text-white'
                      : 'text-[#9A8F82] hover:text-[#1C1712] hover:bg-[#F5F0E8]'
                  }`}>
                  {label} ({grouped[key as keyof typeof grouped].length})
                </a>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EBE0] text-left bg-[#FDFAF8]">
                <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Revenue</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">{activeTab === 'trial' ? 'Trial Ends' : 'Since'}</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9A8F82] uppercase tracking-wider">Sub ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {grouped[activeTab].map((c: any) => (
                <tr key={c.id} className="hover:bg-[#FFFBEF] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] border border-[#E8E2D8] flex items-center justify-center">
                        <span className="text-xs font-bold text-[#B8860B]">{c.name?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1C1712]">{c.name}</p>
                        <p className="text-xs text-[#9A8F82]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${planColors[c.plan?.name] ?? 'text-[#9A8F82] bg-[#F5F0E8]'}`}>
                      {c.plan?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.plan?.price_monthly
                      ? <span className="text-sm font-semibold text-emerald-600">₹{Number(c.plan.price_monthly).toLocaleString('en-IN')}/mo</span>
                      : <span className="text-sm text-[#9A8F82]">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#9A8F82]">
                    {activeTab === 'trial' && c.trial_ends_at
                      ? new Date(c.trial_ends_at).toLocaleDateString('en-IN')
                      : new Date(c.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-mono text-[#B8B0A0]">{c.subscription_id ?? '—'}</span>
                  </td>
                </tr>
              ))}
              {!grouped[activeTab].length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#9A8F82] text-sm">
                    No {activeTab} subscriptions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}