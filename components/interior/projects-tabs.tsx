'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderOpen, Users, Palette, Package, FileText } from 'lucide-react'

const BASE = '/dashboard/industries/interior-design/projects'
const QUOTATIONS_HREF = '/dashboard/industries/interior-design/finance/quotations'

const TABS = [
  { key: 'all',        label: 'All Projects', href: BASE,                 icon: FolderOpen },
  { key: 'clients',    label: 'Clients',      href: `${BASE}/clients`,    icon: Users      },
  { key: 'designs',    label: 'Designs',      href: `${BASE}/designs`,    icon: Palette    },
  { key: 'materials',  label: 'Materials',    href: `${BASE}/materials`,  icon: Package    },
  { key: 'quotations', label: 'Quotations',   href: QUOTATIONS_HREF,      icon: FileText   },
]

export default function ProjectsTabs({ active: _active }: { active?: string }) {
  const pathname = usePathname()

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.key === 'all') return pathname === BASE || pathname === BASE + '/'
    return pathname.startsWith(tab.href)
  }

  return (
    <div className="flex gap-1 p-1 rounded-2xl border border-[#E2D9C8]" style={{ background: '#EDE8DF' }}>
      {TABS.map(tab => {
        const Icon    = tab.icon
        const active  = isActive(tab)
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 no-underline"
            style={{
              background: active ? '#1C1712' : 'transparent',
              color:      active ? '#F5F0E8' : '#7A6E60',
              boxShadow:  active ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </Link>
        )
      })}
    </div>
  )
}