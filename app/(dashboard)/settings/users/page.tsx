import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import ChangePasswordCard from '@/components/settings/ChangePasswordCard'

export const dynamic = 'force-dynamic'

export default async function SettingsUsersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1C1712]">My Account</h1>
        <p className="text-sm text-[#7A6E60] mt-0.5">Manage your personal profile and security settings</p>
      </div>

      {/* My Profile */}
      <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2D9C8] bg-[#F5F0E8]">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-[#B8860B]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1712]">My Profile</h2>
            <p className="text-xs text-[#9A8F82]">Update your personal information</p>
          </div>
        </div>
        <div className="p-5 space-y-4">

          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-[#E2D9C8]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1712]">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-[#9A8F82]">{user.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 bg-[#B8860B]/10 text-[#B8860B] text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                {profile?.role === 'admin' || profile?.role === 'tenant_admin' ? '👑' : '👤'}
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              defaultValue={profile?.full_name ?? ''}
              className="w-full bg-white border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#1C1712] outline-none focus:border-[#B8860B] transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email - disabled */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                defaultValue={user?.email ?? ''}
                disabled
                className="w-full bg-[#F5F0E8] border border-[#E2D9C8] rounded-xl px-4 py-2.5 text-sm text-[#9A8F82] cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-[#E2D9C8] text-[#9A8F82] px-2 py-0.5 rounded-full">
                LOCKED
              </span>
            </div>
            <p className="text-[11px] text-[#9A8F82] mt-1">Email cannot be changed. Contact admin if needed.</p>
          </div>

          {/* Role - display only */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-1.5">
              Role
            </label>
            <div className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-xl px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[#B8860B] text-sm font-semibold capitalize">
                {profile?.role === 'admin' || profile?.role === 'tenant_admin' ? '👑' : '👤'}
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
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