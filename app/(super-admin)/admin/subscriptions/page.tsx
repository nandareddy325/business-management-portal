// app/(super-admin)/admin/tenants/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Users, TrendingUp, ArrowLeft,
  Calendar, Activity, ChevronRight,
  CreditCard, Hash, CheckCircle2, XCircle, Crown
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

  // Get company details
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (!company) redirect('/admin/tenants')

  // Get related data
  const [
    { count: totalLeads },
    { count: totalUsers },
    { data: recentLeads },
  ] = await Promise.all([
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).eq('company_id', id),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', id),
    supabaseAdmin.from('leads').select('lead_name, status, created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  const isLifetime = company.plan === 'lifetime'

  const planBadge = isLifetime
    ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
    : company.plan === 'trial'
    ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
    : 'bg-violet-500/10 text-violet-400 ring-violet-500/20'

  const statCards = [
    {
      label: 'Total Leads',
      value: totalLeads ?? 0,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-300',
      ring: 'ring-amber-500/15',
    },
    {
      label: 'Team Members',
      value: totalUsers ?? 0,
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-300',
      ring: 'ring-blue-500/15',
    },
    {
      label: 'Plan',
      value: company.plan ? company.plan.charAt(0).toUpperCase() + company.plan.slice(1) : 'No Plan',
      icon: isLifetime ? Crown : CreditCard,
      iconBg: isLifetime ? 'bg-amber-500/10' : 'bg-violet-500/10',
      iconColor: isLifetime ? 'text-amber-400' : 'text-violet-400',
      valueColor: isLifetime ? 'text-amber-300' : 'text-violet-300',
      ring: isLifetime ? 'ring-amber-500/15' : 'ring-violet-500/15',
    },
  ]

  const detailRows = [
    { label: 'Company ID', value: company.id, icon: Hash },
    { label: 'Industry', value: company.industry ?? '—', icon: Building2 },
    { label: 'Plan', value: company.plan ?? '—', icon: CreditCard },
    { label: 'Status', value: company.is_active ? 'Active' : 'Inactive', icon: Activity },
    {
      label: 'Joined',
      value: new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      icon: Calendar,
    },
  ]

  const statusColor: Record<string, string> = {
    new:        'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    follow_up:  'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    won:        'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    lost:       'bg-red-500/10 text-red-400 ring-red-500/20',
    site_visit: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    quotation:  'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0D]">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0A0A0D]/80 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/admin/tenants"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Tenants
          </Link>
          <div className="flex items-center gap-2">
            {isLifetime && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 bg-amber-500/15 text-amber-300 ring-amber-500/30">
                <Crown size={10} /> Lifetime
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ${
              company.is_active
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                : 'bg-red-500/10 text-red-400 ring-red-500/20'
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
              ? 'bg-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-white/[0.04] ring-1 ring-white/10'
          }`}>
            {isLifetime
              ? <Crown size={24} className="text-amber-400" />
              : <Building2 size={24} className="text-amber-400" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-widest uppercase text-amber-400/60 mb-1">Tenant</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${planBadge}`}>
                {company.plan ?? 'No Plan'}
              </span>
              <span className="text-xs text-white/30">{company.industry ?? ''}</span>
            </div>
          </div>
        </div>

        {/* Lifetime banner */}
        {isLifetime && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 ring-1 ring-amber-500/20">
            <Crown size={16} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              This tenant has <span className="font-bold text-amber-300">Lifetime Free Access</span> — no payment required, never expires.
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
                className={`relative bg-white/[0.03] ring-1 ${card.ring} rounded-2xl p-4 sm:p-5 flex flex-col gap-3 overflow-hidden`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={15} className={card.iconColor} />
                </div>
                <div>
                  <p className={`text-xl sm:text-2xl font-bold tracking-tight ${card.valueColor}`}>
                    {card.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/30 mt-0.5 leading-tight">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Company Details */}
        <div className="bg-white/[0.03] ring-1 ring-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Building2 size={13} className="text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Company Details</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {detailRows.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.02] transition-colors gap-4"
                >
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <Icon size={13} className="text-white/20" />
                    <p className="text-xs text-white/40">{item.label}</p>
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold font-mono text-right truncate max-w-[55%] ${
                    item.label === 'Plan' && isLifetime ? 'text-amber-300' : 'text-white/70'
                  }`}>
                    {item.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white/[0.03] ring-1 ring-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp size={13} className="text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-white">Recent Leads</h2>
              {(recentLeads ?? []).length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                  {recentLeads?.length}
                </span>
              )}
            </div>
            <a
              href={`/admin/tenants/${id}/leads`}
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/50 hover:text-amber-400 transition-colors"
            >
              View all <ChevronRight size={11} />
            </a>
          </div>

          {(recentLeads ?? []).length === 0 ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={16} className="text-white/15" />
              </div>
              <p className="text-sm font-semibold text-white/25">No leads yet</p>
              <p className="text-xs text-white/15 mt-1">Leads will appear here once added</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(recentLeads as { lead_name: string; created_at: string; status?: string }[] ?? []).map((lead) => (
                <div
                  key={lead.lead_name + lead.created_at}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.02] transition-colors gap-3"
                >
                  <p className="text-sm font-semibold text-white/70 truncate">{lead.lead_name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${
                      statusColor[lead.status] ?? 'bg-white/5 text-white/30 ring-white/10'
                    }`}>
                      {lead.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-white/20 hidden sm:block">
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