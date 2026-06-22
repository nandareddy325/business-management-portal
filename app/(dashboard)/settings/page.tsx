import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import ChangePasswordCard from '@/components/settings/ChangePasswordCard'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*, company:companies(*)').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const initials = profile?.full_name
    ? profile.full_name.trim().split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase()
    : (user.email?.charAt(0)?.toUpperCase() ?? 'U')

  const cardStyle = { background:'#fff', border:'1px solid #E2D9C8', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }
  const fieldStyle = { background:'#FAFAF8', border:'1px solid #E2D9C8', borderRadius:'12px', padding:'10px 16px', fontSize:'14px', color:'#1C1712' }
  const disabledStyle = { background:'#F5F0E8', border:'1px solid #E2D9C8', borderRadius:'12px', padding:'10px 16px', fontSize:'14px', color:'#9A8F82' }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-2xl">

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[4px] mb-1" style={{ color:'#B8860B' }}>Settings</p>
        <h1 className="text-xl font-black text-[#1C1712]">My Profile</h1>
        <p className="text-sm text-[#7A6E60] mt-0.5">Manage your personal profile and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EBE0]" style={{ background:'#1C1712' }}>
          <Users size={16} color="#B8860B" />
          <div>
            <h2 className="text-sm font-bold text-white">My Profile</h2>
            <p className="text-xs" style={{ color:'#B8860B' }}>Your personal information</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-[#F0EBE0]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background:'#1C1712', color:'#B8860B' }}>{initials}</div>
            <div>
              <p className="text-sm font-bold text-[#1C1712]">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-[#7A6E60]">{user.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize"
                style={{ background:'#B8860B20', color:'#B8860B' }}>
                {profile?.role === 'admin' || profile?.role === 'tenant_admin' ? '👑' : '👤'}
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">Full Name</label>
            <div style={fieldStyle}>{profile?.full_name ?? '—'}</div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">Email</label>
            <div style={{ ...disabledStyle, position:'relative' }}>
              {user?.email}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:'#E2D9C8', color:'#9A8F82' }}>LOCKED</span>
            </div>
            <p className="text-[11px] text-[#9A8F82] mt-1">Email cannot be changed. Contact admin if needed.</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#7A6E60] uppercase tracking-wider mb-1.5">Role</label>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full capitalize"
              style={{ background:'#B8860B20', color:'#B8860B' }}>
              {profile?.role === 'admin' || profile?.role === 'tenant_admin' ? '👑' : '👤'}
              {profile?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <ChangePasswordCard />
    </div>
  )
}