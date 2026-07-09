// components/super-admin/dashboard/QuickAccessGrid.tsx
'use client'

import Link from 'next/link'
import {
  Building2, Users, BarChart3, TrendingUp, CreditCard,
  Key, Database, Headphones, Mail, ArrowRight
} from 'lucide-react'

interface QuickAccessItem {
  href: string
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const ITEMS: QuickAccessItem[] = [
  { href: '/admin/tenants',         label: 'Tenants',        description: 'Manage tenant companies',   icon: Building2,   color: '#60A5FA' },
  { href: '/admin/users',           label: 'Users',          description: 'View & manage users',        icon: Users,       color: '#F59E0B' },
  { href: '/admin/analytics',       label: 'Analytics',      description: 'Usage & growth metrics',     icon: BarChart3,   color: '#A78BFA' },
  { href: '/admin/revenue',         label: 'Revenue',        description: 'Track platform revenue',     icon: TrendingUp,  color: '#34D399' },
  { href: '/admin/subscriptions',   label: 'Subscriptions',  description: 'Active plans & billing',     icon: CreditCard,  color: '#F472B6' },
  { href: '/admin/api-keys',        label: 'API Keys',       description: 'Manage integration keys',    icon: Key,         color: '#FBBF24' },
  { href: '/admin/system-monitor',  label: 'System Monitor', description: 'Service health & uptime',    icon: Database,    color: '#38BDF8' },
  { href: '/admin/backup',          label: 'Backup',         description: 'Backups & restore points',   icon: Database,    color: '#818CF8' },
  { href: '/admin/support-tickets', label: 'Support',        description: 'Pending support tickets',    icon: Headphones,  color: '#FB923C' },
  { href: '/admin/email-templates', label: 'Email',          description: 'Email templates & sends',    icon: Mail,        color: '#4ADE80' },
]

export function QuickAccessGrid() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-6">
      <div className="mb-5">
        <h2 className="font-serif text-sm font-bold text-[#1C1712]">Quick Access</h2>
        <p className="text-[10px] text-[#9A8F82] mt-0.5">Jump straight to any section</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ITEMS.map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col gap-2 p-4 rounded-xl border border-[#E8E2D8] hover:border-black/15 hover:shadow-md transition-all duration-200"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${color}20` }}
            >
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1C1712] leading-tight">{label}</p>
              <p className="text-[10px] text-[#9A8F82] mt-0.5 leading-snug">{description}</p>
            </div>
            <ArrowRight
              size={13}
              className="absolute right-3 top-3 text-black/20 group-hover:text-black/50 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
