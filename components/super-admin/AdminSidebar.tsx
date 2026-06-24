'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, CreditCard,
  TrendingUp, Settings, LogOut, Shield, ChevronLeft, ChevronRight
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const navItems = [
  { label: 'Dashboard',     href: '/admin/dashboard',     icon: LayoutDashboard },
  { label: 'Tenants',       href: '/admin/tenants',       icon: Building2 },
  { label: 'Revenue',       href: '/admin/revenue',       icon: TrendingUp },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className={`flex flex-col h-screen bg-[#1C1712] border-r border-white/10 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-md">G</div>
            <div>
              <p className="font-serif text-sm text-white leading-tight">GK · CRM</p>
              <p className="text-[9px] text-[#B8860B] font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white mx-auto shadow-md">G</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Super Admin Badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl border"
          style={{ background: 'rgba(184,134,11,0.12)', borderColor: 'rgba(184,134,11,0.25)' }}>
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-[#B8860B] flex-shrink-0" />
            <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                isActive
                  ? 'text-[#B8860B]'
                  : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
              }`}
              style={isActive ? {
                background: 'rgba(184,134,11,0.15)',
                borderColor: 'rgba(184,134,11,0.3)',
              } : {}}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <a
          href="/admin/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
            pathname === '/admin/settings'
              ? 'text-[#B8860B]'
              : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
          }`}
          style={pathname === '/admin/settings' ? {
            background: 'rgba(184,134,11,0.15)',
            borderColor: 'rgba(184,134,11,0.3)',
          } : {}}
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}