import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Building2, Users, TrendingUp, ArrowLeft, Mail, Calendar, Activity } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('*, plan:plans(name, price_monthly)')
    .eq('id', params.id)
    .single()

  if (!company) redirect('/admin/tenants')

  const [
    { count: totalLeads },
    { count: totalUsers },
    { data: recentLeads },
  ] = await Promise.all([
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }).eq('company_id', params.id),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', params.id),
    supabaseAdmin.from('leads').select('lead_name, status, created_at').eq('company_id', params.id).order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        <div>
          <a href="/admin/tenants" className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8F82] hover:text-[#B8860B] transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Tenants
          </a>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F0E8] border border-[#E8E2D8] flex items-center justify-center">
              <Building2 size={24} className="text-[#B8860B]" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-0.5">Tenant</p>
              <h1 className="font-serif text-3xl text-[#1C1712]">{company.name}</h1>
              <p className="text-sm text-[#9A8F82] mt-0.5">{company.email}</p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {company.is_active ? '● Active' : '● Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Leads', value: totalLeads ?? 0, icon: TrendingUp, color: 'text-[#B8860B]', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Team Members', value: totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Plan', value: company.plan?.name ?? 'No Plan', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm`}>
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={16} className={card.color} />
                </div>
                <p className="font-serif text-2xl font-bold text-[#1C1712]">{card.value}</p>
                <p className="text-xs text-[#9A8F82] mt-0.5">{card.label}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">Company Details</h2>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {[
              { label: 'Company ID', value: company.id, icon: Building2 },
              { label: 'Email', value: company.email ?? '—', icon: Mail },
              { label: 'Plan', value: company.plan?.name ?? '—', icon: Activity },
              { label: 'Plan Status', value: company.plan_status ?? '—', icon: Activity },
              { label: 'Monthly Revenue', value: company.plan?.price_monthly ? `₹${company.plan.price_monthly}/mo` : '—', icon: TrendingUp },
              { label: 'Joined', value: new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), icon: Calendar },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FFFBEF] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="text-[#9A8F82]" />
                    <p className="text-sm text-[#9A8F82]">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1C1712] font-mono text-right max-w-xs truncate">{item.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE0]" style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
            <h2 className="font-serif text-base text-[#1C1712]">Recent Leads</h2>
          </div>
          <div className="divide-y divide-[#F0EBE0]">
            {(recentLeads ?? []).length === 0 ? (
              <p className="text-center py-8 text-sm text-[#9A8F82]">No leads yet</p>
            ) : (recentLeads ?? []).map((lead: any) => (
              <div key={lead.lead_name + lead.created_at} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FFFBEF] transition-colors">
                <p className="text-sm font-semibold text-[#1C1712]">{lead.lead_name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#9A8F82] capitalize">{lead.status}</span>
                  <span className="text-xs text-[#B8B0A0]">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}