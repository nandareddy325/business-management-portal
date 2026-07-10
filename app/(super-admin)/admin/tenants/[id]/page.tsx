// app/(super-admin)/admin/tenants/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Users, TrendingUp, ArrowLeft,
  Calendar, Activity, ChevronRight,
  CreditCard, Hash, CheckCircle2, XCircle, Crown, Receipt, IndianRupee
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function TenantDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (!company) redirect('/admin/tenants')

  const [
    { count: totalLeads },
    { count: totalUsers },
    { data: recentLeads },
    { data: subscription },
  ] = await Promise.all([
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).eq('company_id', id),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', id),
    supabaseAdmin.from('leads').select('lead_name, status, created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('company_subscriptions').select('status, activated_at, total_amount').eq('company_id', id).maybeSingle(),
  ])

  const isLifetime = company.plan === 'lifetime'
  const isSubActive = subscription?.status === 'active'

  const planBadge = isLifetime
    ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : company.plan === 'trial'
    ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : 'bg-violet-50 text-violet-700 ring-violet-200'

  const statCards = [
    {
      label: 'Total Leads',
      value: totalLeads ?? 0,
      icon: TrendingUp,
      trend: '+12%',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Team Members',
      value: totalUsers ?? 0,
      icon: Users,
      trend: '+2',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Plan',
      value: company.plan ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1) : 'No Plan',
      icon: isLifetime ? Crown : CreditCard,
      trend: isLifetime ? '\u221e' : '30 days',
      trendColor: isLifetime ? 'text-amber-600' : 'text-orange-600',
    },
  ]

  const detailRows = [
    { label: 'Company ID', value: company.id, icon: Hash },
    { label: 'Industry', value: company.industry ?? '\u2014', icon: Building2 },
    { label: 'Plan', value: company.plan ?? '\u2014', icon: CreditCard },
    { label: 'Status', value: company.is_active ? 'Active' : 'Inactive', icon: Activity },
    {
      label: 'Joined',
      value: new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      icon: Calendar,
    },
  ]

  const statusColor: Record<string, string> = {
    new:        'bg-blue-50 text-blue-700 ring-blue-200',
    follow_up:  'bg-amber-50 text-amber-700 ring-amber-200',
    won:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
    lost:       'bg-red-50 text-red-700 ring-red-200',
    site_visit: 'bg-violet-50 text-violet-700 ring-violet-200',
    quotation:  'bg-cyan-50 text-cyan-700 ring-cyan-200',
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        .serif-font { font-family: 'Playfair Display', serif; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .gold-shimmer-text {
          background: linear-gradient(90deg, #B8860B 0%, #E8C547 50%, #B8860B 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-[#E8E2D8] bg-[#F5F0E8]/85 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/admin/tenants"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={13} /> Back to Tenants
          </Link>
          <div className="flex items-center gap-2">
            {isLifetime && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">
                <Crown size={10} /> Lifetime
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ${
              company.is_active
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-red-50 text-red-700 ring-red-200'
            }`}>
              {company.is_active
                ? <><CheckCircle2 size={10} /> Active</>
                : <><XCircle size={10} /> Inactive</>
              }
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">

        {/* Hero header */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isLifetime
              ? 'bg-amber-50 ring-1 ring-amber-200'
              : 'bg-white ring-1 ring-[#E8E2D8]'
          }`}>
            {isLifetime
              ? <Crown size={24} className="text-amber-600" />
              : <Building2 size={24} className="text-[#B8860B]" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#B8860B] mb-1">Tenant</p>
            <h1 className="serif-font text-2xl sm:text-3xl text-[#1C1712] tracking-tight truncate">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${planBadge}`}>
                {company.plan ?? 'No Plan'}
              </span>
              <span className="text-xs text-[#9A8F82]">{company.industry ?? ''}</span>
            </div>
          </div>
        </div>

        {/* Lifetime banner */}
        {isLifetime && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 ring-1 ring-amber-200">
            <Crown size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              This tenant has <span className="font-bold">Lifetime Free Access</span> \u2014 no payment required, never expires.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="relative bg-white ring-1 ring-[#E8E2D8] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/5 transition-all duration-300 group overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5F0E8] group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                  <Icon size={15} className="text-[#B8860B]" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1712]">
                    {card.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#9A8F82] mt-0.5 leading-tight">{card.label}</p>
                </div>
                <span className={`absolute top-4 right-4 text-[10px] font-bold ${card.trendColor}`}>{card.trend}</span>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#B8860B] group-hover:w-full transition-all duration-500" />
              </div>
            )
          })}
        </div>

        {/* Subscription and Billing - dark accent card on light page */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-amber-900/5"
          style={{ background: 'linear-gradient(160deg, #1C1712 0%, #241b12 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle at 10% 0%, #B8860B, transparent 40%)',
          }} />

          <div className="relative flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#B8860B]/15 flex items-center justify-center">
                <Receipt size={13} className="text-[#E8C547]" />
              </div>
              <h2 className="text-sm font-semibold text-white/90">Subscription &amp; Billing</h2>
            </div>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isSubActive
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
                : 'bg-white/10 text-white/40 ring-1 ring-white/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
              {subscription?.status
                ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
                : 'No Subscription'}
            </span>
          </div>

          <div className="relative px-5 sm:px-6 pt-6 pb-5">
            <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-bold mb-1.5">Amount Paid</p>
            <div className="flex items-baseline gap-1">
              <IndianRupee size={22} className="gold-shimmer-text" strokeWidth={2.5} />
              <p className="serif-font text-4xl gold-shimmer-text tracking-tight">
                {subscription?.total_amount ? subscription.total_amount.toLocaleString('en-IN') : '0'}
              </p>
            </div>
            <p className="text-[11px] text-white/25 mt-2">
              {subscription?.activated_at
                ? `Activated on ${new Date(subscription.activated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Not yet activated'}
            </p>
          </div>

          <div className="relative divide-y divide-white/[0.06] border-t border-white/10">
            {[
              { label: 'Data Points', value: `${(totalLeads ?? 0) + (totalUsers ?? 0)}`, icon: Activity },
              { label: 'Users Count', value: `${totalUsers ?? 0}`, icon: Users },
              { label: 'Account Status', value: company.is_active ? 'Active' : 'Inactive', icon: CheckCircle2, danger: !company.is_active },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-between px-5 sm:px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Icon size={13} className="text-white/25" />
                    <p className="text-xs text-white/50">{item.label}</p>
                  </div>
                  <p className={`text-xs font-bold ${item.danger ? 'text-red-400' : 'text-white/85'}`}>
                    {item.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white ring-1 ring-[#E8E2D8] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Building2 size={13} className="text-[#B8860B]" />
            </div>
            <h2 className="text-sm font-bold text-[#1C1712]">Company Details</h2>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {detailRows.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-[#FDFAF8] transition-colors gap-4"
                >
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <Icon size={13} className="text-[#D3CBBB]" />
                    <p className="text-xs text-[#9A8F82]">{item.label}</p>
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold font-mono text-right truncate max-w-[55%] ${
                    item.label === 'Plan' && isLifetime ? 'text-amber-700' : 'text-[#1C1712]'
                  }`}>
                    {item.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white ring-1 ring-[#E8E2D8] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp size={13} className="text-[#B8860B]" />
              </div>
              <h2 className="text-sm font-bold text-[#1C1712]">Recent Leads</h2>
              {(recentLeads ?? []).length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#B8860B]">
                  {recentLeads?.length}
                </span>
              )}
            </div>
            <a
              href={`/admin/tenants/${id}/leads`}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#B8860B]/70 hover:text-[#B8860B] transition-colors"
            >
              View all <ChevronRight size={11} />
            </a>
          </div>

          {(recentLeads ?? []).length === 0 ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={16} className="text-[#D3CBBB]" />
              </div>
              <p className="text-sm font-semibold text-[#9A8F82]">No leads yet</p>
              <p className="text-xs text-[#C4BAB0] mt-1">Leads will appear here once added</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE0]">
              {(recentLeads as { lead_name: string; created_at: string; status?: string }[] ?? []).map((lead) => (
                <div
                  key={lead.lead_name + lead.created_at}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-[#FDFAF8] transition-colors gap-3"
                >
                  <p className="text-sm font-semibold text-[#1C1712] truncate">{lead.lead_name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${
                      statusColor[lead.status] ?? 'bg-[#F5F0E8] text-[#9A8F82] ring-[#E8E2D8]'
                    }`}>
                      {lead.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[#C4BAB0] hidden sm:block">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
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
