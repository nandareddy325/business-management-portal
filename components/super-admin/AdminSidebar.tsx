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
    <aside className={`flex flex-col h-screen transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}
      style={{ background: '#FFFFFF', borderRight: '1px solid #E8E2D8' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom: '1px solid #E8E2D8' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-md">G</div>
            <div>
              <p className="font-serif text-sm leading-tight" style={{ color: '#1C1712' }}>GK · CRM</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>Super Admin</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white mx-auto shadow-md">G</div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
          style={{ background: '#F5F0E8', color: '#9A8F82' }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Super Admin Badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center gap-2">
          <Shield size={12} style={{ color: '#B8860B' }} className="flex-shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>Super Admin</p>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? '#B8860B' : '#7A6E60',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#1C1712'
                  ;(e.currentTarget as HTMLElement).style.background = '#F5F0E8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#7A6E60'
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }
              }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1 h-4 rounded-full" style={{ background: '#B8860B' }} />
              )}
            </a>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid #E8E2D8' }}>
        <a href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{
            color: pathname === '/admin/settings' ? '#B8860B' : '#7A6E60',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            if (pathname !== '/admin/settings') {
              (e.currentTarget as HTMLElement).style.color = '#1C1712'
              ;(e.currentTarget as HTMLElement).style.background = '#F5F0E8'
            }
          }}
          onMouseLeave={e => {
            if (pathname !== '/admin/settings') {
              (e.currentTarget as HTMLElement).style.color = '#7A6E60'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }
          }}
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
          {pathname === '/admin/settings' && !collapsed && (
            <span className="ml-auto w-1 h-4 rounded-full" style={{ background: '#B8860B' }} />
          )}
        </a>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: '#DC2626', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#B91C1C'
            ;(e.currentTarget as HTMLElement).style.background = '#FEF2F2'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = '#DC2626'
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}