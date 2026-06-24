import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Shield, Bell, Database, Globe, Lock, ChevronRight } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id ?? '')
    .single()

  const settingsSections = [
    {
      title: 'Platform Settings',
      icon: Globe,
      items: [
        { label: 'Platform Name', value: 'GK CRM', type: 'text' },
        { label: 'Support Email', value: 'support@gkcrm.in', type: 'text' },
        { label: 'Default Trial Days', value: '14', type: 'number' },
      ],
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'Two-Factor Auth', value: 'Enabled', type: 'badge-green' },
        { label: 'Session Timeout', value: '24 hours', type: 'text' },
        { label: 'IP Whitelist', value: 'Disabled', type: 'badge-gray' },
      ],
    },
    {
      title: 'Database',
      icon: Database,
      items: [
        { label: 'Provider', value: 'Supabase', type: 'text' },
        { label: 'Region', value: 'ap-south-1 (Mumbai)', type: 'text' },
        { label: 'Backup Frequency', value: 'Daily', type: 'badge-green' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'New Tenant Signup', value: 'Email + Dashboard', type: 'text' },
        { label: 'Payment Failed', value: 'Email', type: 'text' },
        { label: 'Subscription Expired', value: 'Email + Dashboard', type: 'text' },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#B8860B] mb-1">Super Admin</p>
          <h1 className="font-serif text-3xl text-[#1C1712]">Settings</h1>
          <p className="text-sm text-[#9A8F82] mt-1">Platform configuration & preferences</p>
        </div>

        {/* Admin Profile Card */}
        <div className="bg-[#1C1712] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #B8860B, transparent 60%)' }} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {profile?.full_name?.[0] ?? 'S'}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{profile?.full_name ?? 'Super Admin'}</p>
              <p className="text-white/50 text-sm">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield size={10} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Super Admin</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Last Login</p>
              <p className="text-xs text-white/60 mt-0.5">Today</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#F0EBE0]"
                style={{ background: 'linear-gradient(135deg, #FFFBEF, #FEFCF8)' }}>
                <div className="w-7 h-7 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
                  <Icon size={14} className="text-[#B8860B]" />
                </div>
                <h2 className="font-serif text-base text-[#1C1712]">{section.title}</h2>
              </div>
              <div className="divide-y divide-[#F0EBE0]">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-6 py-4 hover:bg-[#FFFBEF] transition-colors group cursor-pointer">
                    <p className="text-sm font-medium text-[#1C1712]">{item.label}</p>
                    <div className="flex items-center gap-2">
                      {item.type === 'badge-green' && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{item.value}</span>
                      )}
                      {item.type === 'badge-gray' && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F0E8] text-[#9A8F82]">{item.value}</span>
                      )}
                      {(item.type === 'text' || item.type === 'number') && (
                        <span className="text-sm text-[#9A8F82]">{item.value}</span>
                      )}
                      <ChevronRight size={14} className="text-[#D3CBBB] group-hover:text-[#B8860B] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-red-100 bg-red-50">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield size={14} className="text-red-500" />
            </div>
            <h2 className="font-serif text-base text-red-700">Danger Zone</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            {[
              { label: 'Clear All Cache', sub: 'Force refresh all cached data across platform', btn: 'Clear Cache', btnStyle: 'border border-[#E8E2D8] text-[#1C1712] hover:border-[#B8860B]' },
              { label: 'Maintenance Mode', sub: 'Temporarily disable access for all tenants', btn: 'Enable', btnStyle: 'border border-amber-200 text-amber-700 hover:bg-amber-50' },
              { label: 'Reset Platform', sub: 'This action is irreversible. All data will be lost.', btn: 'Reset', btnStyle: 'border border-red-200 text-red-600 hover:bg-red-50' },
            ].map(action => (
              <div key={action.label} className="flex items-center justify-between py-3 border-b border-[#F0EBE0] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#1C1712]">{action.label}</p>
                  <p className="text-xs text-[#9A8F82] mt-0.5">{action.sub}</p>
                </div>
                <button className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${action.btnStyle}`}>
                  {action.btn}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}