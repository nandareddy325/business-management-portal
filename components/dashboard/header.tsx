'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  message: string
  time: string
  read: boolean
  type: 'lead' | 'payment' | 'system'
}

interface HeaderProps {
  onMenuClick: () => void
  title?: string
  subtitle?: string
}

export function Header({ onMenuClick, title = 'Dashboard', subtitle = 'Overview' }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userInitials, setUserInitials] = useState('GK')
  const [userName, setUserName] = useState('Ghana Kumar')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<string>('connecting')
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserEmail(user.email || '')

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setUserName(profile.full_name)
          const parts = profile.full_name.trim().split(' ')
          setUserInitials(parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase())
        }

        setUserRole(
          ['admin', 'tenant_admin', 'manager'].includes(profile?.role)
            ? 'admin' : 'user'
        )
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
    }
    getUser()
  }, [])

  // ── Realtime notifications — fixed chain ──
  useEffect(() => {
    const channel = supabase
      .channel(`leads-notifications-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const newLead = payload.new as Record<string, string>
          const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          setNotifications(prev => [{
            id: `lead-${Date.now()}`,
            message: `New lead: ${newLead.lead_name || 'Unknown'} · ${newLead.source || 'Unknown source'}`,
            time: now,
            read: false,
            type: 'lead',
          }, ...prev.slice(0, 19)])
        }
      )
      .subscribe((status) => setRealtimeStatus(status))

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  const getGradient = (initials: string) => {
    const g = ['from-violet-500 to-purple-700','from-blue-500 to-cyan-700','from-emerald-500 to-teal-700','from-amber-500 to-orange-600','from-pink-500 to-rose-700','from-indigo-500 to-blue-700']
    return g[initials.charCodeAt(0) % g.length]
  }

  const roleStyle = userRole === 'admin'
    ? { bg: 'bg-[#B8860B]/10', text: 'text-[#B8860B]', label: '✦ Admin' }
    : { bg: 'bg-blue-50', text: 'text-blue-600', label: '👤 User' }

  const notifTypeStyle: Record<string, string> = { lead: 'bg-blue-50', payment: 'bg-emerald-50', system: 'bg-[#F5F0E8]' }
  const notifTypeIcon: Record<string, string> = { lead: '🎯', payment: '💰', system: '⚙️' }

  const menuItems = userRole === 'admin'
    ? [
        { icon: '⚙️', label: 'Settings',      href: '/dashboard/settings' },
        { icon: '👤', label: 'My Profile',    href: '/dashboard/settings' },
        { icon: '🏢', label: 'Company Setup', href: '/dashboard/settings' },
      ]
    : [
        { icon: '👤', label: 'My Profile', href: '/dashboard/settings' },
      ]

  return (
    <header className="h-16 bg-white border-b border-[#E8E2D8] flex items-center px-5 gap-4 sticky top-0 z-30">

      <button className="lg:hidden p-1.5 rounded-lg hover:bg-[#F5F0E8] transition-colors" onClick={onMenuClick}>
        <Menu size={20} className="text-[#1C1712]" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="font-serif text-lg text-[#1C1712] truncate">
          {title} <span className="font-sans text-sm text-[#9A8F82] font-normal">/ {subtitle}</span>
        </h1>
      </div>

      <span className="hidden lg:block text-xs text-[#9A8F82] whitespace-nowrap">{today}</span>

      <div title={`Realtime: ${realtimeStatus}`}
        className={`hidden lg:block w-2 h-2 rounded-full flex-shrink-0 ${
          realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-400' :
          realtimeStatus === 'CLOSED' || realtimeStatus === 'CHANNEL_ERROR' ? 'bg-red-400' :
          'bg-amber-400 animate-pulse'
        }`}
      />

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
          className="relative w-9 h-9 rounded-xl border border-[#E8E2D8] bg-[#F7F5F1] flex items-center justify-center text-[#7A6E60] hover:bg-[#F0EBE0] hover:border-[#B8860B] transition-all">
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-[#E8E2D8] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#1C1712]">Notifications</p>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-[#B8860B] hover:underline font-medium">Mark all read</button>
              )}
            </div>

            {realtimeStatus !== 'SUBSCRIBED' && (
              <div className={`px-4 py-2 text-[10px] font-medium flex items-center gap-1.5 ${realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'CLOSED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'CLOSED' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                {realtimeStatus === 'CHANNEL_ERROR' ? 'Realtime disconnected' :
                 realtimeStatus === 'CLOSED' ? 'Realtime closed. Refresh చేయి.' :
                 'Connecting to realtime...'}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-sm font-medium text-[#1C1712]">No notifications yet</p>
                  <p className="text-xs text-[#B8B0A0] mt-1">Lead add అయినప్పుడు ఇక్కడ వస్తాయి</p>
                </div>
              ) : notifications.map(notif => (
                <div key={notif.id}
                  onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#F7F5F1] last:border-0 cursor-pointer hover:bg-[#FDFAF8] transition-colors ${!notif.read ? 'bg-amber-50/40' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${notifTypeStyle[notif.type]}`}>
                    {notifTypeIcon[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!notif.read ? 'font-semibold text-[#1C1712]' : 'text-[#7A6E60]'}`}>{notif.message}</p>
                    <p className="text-[10px] text-[#B8B0A0] mt-0.5">{notif.time}</p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 bg-[#B8860B] rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-[#F0EBE0] bg-[#FDFAF8] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <p className="text-[10px] text-[#B8B0A0]">{realtimeStatus === 'SUBSCRIBED' ? 'Live — auto updates' : 'Connecting...'}</p>
              </div>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-[10px] text-[#B8B0A0] hover:text-red-500 transition-colors">Clear all</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="relative" ref={profileRef}>
        <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(userInitials)} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
            {userInitials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#1C1712] leading-tight">{userName.split(' ')[0]}</p>
            <p className={`text-[10px] leading-tight font-semibold ${roleStyle.text}`}>{roleStyle.label}</p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-12 w-64 bg-white border border-[#E8E2D8] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50">
            <div className="px-4 py-4 border-b border-[#F0EBE0] bg-[#FDFAF8]">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(userInitials)} flex items-center justify-center text-lg font-bold text-white shadow-sm`}>
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1C1712] truncate">{userName}</p>
                  <p className="text-[11px] text-[#9A8F82] truncate">{userEmail}</p>
                  <span className={`inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${roleStyle.bg} ${roleStyle.text}`}>
                    {roleStyle.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="py-1.5">
              {menuItems.map(item => (
                <a key={item.label} href={item.href} onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1C1712] hover:bg-[#F5F0E8] transition-colors">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </div>
            <div className="border-t border-[#F0EBE0] py-1.5">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                <span className="text-base">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}