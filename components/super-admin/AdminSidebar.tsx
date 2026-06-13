'use client'
// components/super-admin/AdminSidebar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, CreditCard, Building2,
  Users, BarChart3, Settings, Bell, FileText, LogOut, Shield
} from 'lucide-react'

const navItems = [
  { label: 'OVERVIEW', type: 'section' },
  { label: 'Dashboard',      href: '/admin/dashboard',      icon: LayoutDashboard },
  { label: 'Revenue',        href: '/admin/revenue',        icon: TrendingUp },
  { label: 'Analytics',      href: '/admin/analytics',      icon: BarChart3 },
  { label: 'MANAGEMENT', type: 'section' },
  { label: 'All Tenants',    href: '/admin/tenants',        icon: Building2 },
  { label: 'Subscriptions',  href: '/admin/subscriptions',  icon: CreditCard },
  { label: 'All Users',      href: '/admin/users',          icon: Users },
  { label: 'FINANCE', type: 'section' },
  { label: 'Plans',          href: '/admin/plans',          icon: FileText },
  { label: 'Payments',       href: '/admin/payments',       icon: CreditCard },
  { label: 'SYSTEM', type: 'section' },
  { label: 'Audit Logs',     href: '/admin/audit-logs',     icon: FileText },
  { label: 'Notifications',  href: '/admin/notifications',  icon: Bell },
  { label: 'Settings',       href: '/admin/settings',       icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-gray-900" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">GK CRM</p>
            <p className="text-[10px] text-amber-500 font-medium tracking-widest uppercase">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.type === 'section') {
            return (
              <p key={i} className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase px-2 pt-4 pb-1">
                {item.label}
              </p>
            )
          }
          const Icon = item.icon!
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
