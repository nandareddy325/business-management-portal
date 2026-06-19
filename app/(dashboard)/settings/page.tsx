import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, CreditCard, Users } from 'lucide-react'
import ChangePasswordCard from '@/components/settings/ChangePasswordCard'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const company = profile.company as any

  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('*')
    .eq('company_id', company?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: companyIndustries } = await supabase
    .from('company_industries')
    .select('plan, is_active, industries(name, slug)')
    .eq('company_id', company?.id)
    .eq('is_active', true)

  const trialEnds = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('en-IN')
    : null

  const industryIcons: Record<string, string> = {
    'interior-design': '🛋️',
    'real-estate': '🏠',
    'hospital': '🏥',
    'b2b-business': '🤝',
    'clinics': '🩺',
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1C1712]">Settings</h1>
        <p className="text-sm text-[#7A6E60] mt-0.5">Manage your company and account settings</p>
      </div>

      {/* Company Info */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2D9C8] bg-[#F5F0E8]">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#B8860B]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1C1712]">Company Information</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Company Name</label>
            <input
              defaultValue={company?.name ?? ''}
              className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Email</label>
              <input
                defaultValue={company?.email ?? ''}
                type="email"
                className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Phone</label>
              <input
                defaultValue={company?.phone ?? ''}
                className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2D9C8] bg-[#F5F0E8]">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[#B8860B]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1C1712]">Subscription</h2>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-[#1C1712]">
                  {subscription?.status === 'trial' ? '14-Day Free Trial' :
                   subscription?.status === 'active' ? 'Active Plan' : 'No Active Plan'}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  subscription?.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  subscription?.status === 'trial'  ? 'bg-amber-50 text-amber-700' :
                  'bg-[#F0EBE0] text-[#9A8F82]'
                }`}>
                  {subscription?.status ?? 'Not set up'}
                </span>
              </div>
              {trialEnds && subscription?.status === 'trial' && (
                <p className="text-xs text-amber-600 mt-0.5">Trial ends: {trialEnds}</p>
              )}
              {subscription?.total_amount > 0 && (
                <p className="text-xs text-[#7A6E60] mt-0.5">₹{subscription.total_amount.toLocaleString('en-IN')}/month</p>
              )}
            </div>
            <a href="/billing/invoices"
              className="bg-[#F0EBE0] hover:bg-[#E8E0D0] text-[#1C1712] font-medium px-4 py-2 rounded-xl text-sm transition-colors">
              View Billing
            </a>
          </div>

          {companyIndustries && companyIndustries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-2">Active Industries</p>
              <div className="flex flex-wrap gap-2">
                {companyIndustries.map((ci: any) => (
                  <div key={ci.industries?.slug} className="flex items-center gap-2 bg-[#F5F0E8] border border-[#E2D9C8] px-3 py-2 rounded-xl">
                    <span className="text-base">{industryIcons[ci.industries?.slug] ?? '🏢'}</span>
                    <span className="text-xs font-medium text-[#1C1712]">{ci.industries?.name}</span>
                    <span className="text-[10px] font-bold text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full capitalize">
                      {ci.plan}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Profile */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2D9C8] bg-[#F5F0E8]">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-[#B8860B]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1C1712]">My Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              defaultValue={profile?.full_name ?? ''}
              className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Email</label>
            <input
              defaultValue={user?.email ?? ''}
              disabled
              className="w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-xl px-4 py-2.5 text-sm text-[#9A8F82] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">Role</label>
            <span className="inline-flex items-center gap-1.5 bg-[#B8860B]/10 text-[#B8860B] text-xs font-bold px-3 py-1.5 rounded-full capitalize">
              {profile?.role === 'admin' || profile?.role === 'tenant_admin' ? '👑' : '👤'}
              {profile?.role?.replace('_', ' ')}
            </span>
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Update Profile
          </button>
        </div>
      </div>

      {/* Change Password */}
      <ChangePasswordCard />

    </div>
  )
}