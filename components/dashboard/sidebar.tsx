'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X, ChevronDown, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface SidebarProps { isOpen: boolean; onClose: () => void }

const INDUSTRIES: Record<string, { label: string; icon: string; slug: string }> = {
  'interior-design': { label: 'Interior Design', icon: '🛋️', slug: 'interior-design' },
  'real-estate':     { label: 'Real Estate',     icon: '🏠', slug: 'real-estate' },
  'hospital':        { label: 'Hospital',         icon: '🏥', slug: 'hospital' },
  'b2b-business':    { label: 'B2B Business',    icon: '🤝', slug: 'b2b-business' },
  'clinics':         { label: 'Clinics',          icon: '🩺', slug: 'clinics' },
}

const SECTION_PERMISSION: Record<string, string> = {
  'PIPELINE':    'pipeline',
  'MY PIPELINE': 'pipeline',
  'PROJECTS':    'projects',
  'HR & ADMIN':  'hr',
  'FINANCE':     'finance',
  'SYSTEM':      'pipeline',
  'WORK':        'pipeline',
  'ACCOUNT':     'pipeline',
}

function buildNavGroups(industrySlug: string) {
  const IND = `/dashboard/industries/${industrySlug}`

  const adminNavGroups = [
    {
      section: 'PIPELINE', icon: '🎯',
      items: [
        { label: 'Dashboard',     icon: '📊', href: `${IND}/dashboard`  },
        { label: 'All Leads',     icon: '👥', href: `${IND}/all-leads`  },
        { label: 'New Leads',     icon: '🆕', href: `${IND}/new-leads`  },
        { label: 'Follow Up',     icon: '🔄', href: `${IND}/follow-up`  },
        { label: 'RNR',           icon: '📵', href: `${IND}/rnr`        },
        { label: 'Site Visit',    icon: '🏠', href: `${IND}/site-visit` },
        { label: 'Quotations',    icon: '💰', href: `${IND}/quotations` },
        { label: 'Won / Closing', icon: '🏆', href: `${IND}/won`        },
        { label: 'Lost',          icon: '❌', href: `${IND}/lost`       },
      ],
    },
    {
      section: 'PROJECTS', icon: '🏗️',
      items: [
        { label: 'All Projects', icon: '🏗️', href: `${IND}/projects`  },
        { label: 'Clients',      icon: '👥', href: `${IND}/clients`   },
        { label: 'Designs',      icon: '🎨', href: `${IND}/designs`   },
        { label: 'Materials',    icon: '📦', href: `${IND}/materials` },
      ],
    },
    {
      section: 'HR & ADMIN', icon: '👔',
      items: [
        { label: 'HRMS',       icon: '👔', href: '/hr/employees'  },
        { label: 'Attendance', icon: '📅', href: '/hr/attendance' },
      ],
    },
    {
      section: 'FINANCE', icon: '💳',
      items: [
        { label: 'Invoices', icon: '🧾', href: '/billing/invoices' },
        { label: 'Payments', icon: '💳', href: '/billing/payments' },
        { label: 'Reports',  icon: '📊', href: '/reports'          },
      ],
    },
    {
      section: 'SYSTEM', icon: '⚙️',
      items: [
        { label: 'Settings', icon: '⚙️', href: '/dashboard/settings' },
      ],
    },
  ]

  const employeeNavGroups = [
    {
      section: 'MY PIPELINE', icon: '🎯',
      items: [
        { label: 'Dashboard',  icon: '📊', href: `${IND}/dashboard`  },
        { label: 'All Leads',  icon: '👥', href: `${IND}/all-leads`  },
        { label: 'New Leads',  icon: '🆕', href: `${IND}/new-leads`  },
        { label: 'Follow Up',  icon: '🔄', href: `${IND}/follow-up`  },
        { label: 'RNR',        icon: '📵', href: `${IND}/rnr`        },
        { label: 'Site Visit', icon: '🏠', href: `${IND}/site-visit` },
        { label: 'Quotations', icon: '💰', href: `${IND}/quotations` },
        { label: 'Won',        icon: '🏆', href: `${IND}/won`        },
      ],
    },
    {
      section: 'PROJECTS', icon: '🏗️',
      items: [
        { label: 'My Projects', icon: '🏗️', href: `${IND}/projects` },
        { label: 'Clients',     icon: '👥', href: `${IND}/clients`  },
      ],
    },
    {
      section: 'HR & ADMIN', icon: '👔',
      items: [
        { label: 'Attendance', icon: '📅', href: '/hr/attendance' },
      ],
    },
    {
      section: 'FINANCE', icon: '💳',
      items: [
        { label: 'Invoices', icon: '🧾', href: '/billing/invoices' },
        { label: 'Payments', icon: '💳', href: '/billing/payments' },
      ],
    },
    {
      section: 'ACCOUNT', icon: '🔑',
      items: [
        { label: 'My Account', icon: '👤', href: '/settings/users' },
      ],
    },
  ]

  return { adminNavGroups, employeeNavGroups, IND }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const industryFromUrl = Object.keys(INDUSTRIES).find(slug =>
    pathname.includes(`/dashboard/industries/${slug}`)
  )

  const [currentIndustrySlug, setCurrentIndustrySlug] = useState(industryFromUrl || 'interior-design')

  useEffect(() => {
    if (industryFromUrl) {
      localStorage.setItem('gk-active-industry', industryFromUrl)
      setCurrentIndustrySlug(industryFromUrl)
    } else {
      const saved = localStorage.getItem('gk-active-industry')
      if (saved && INDUSTRIES[saved]) setCurrentIndustrySlug(saved)
    }
  }, [pathname, industryFromUrl])

  const currentIndustry = INDUSTRIES[currentIndustrySlug]
  const { adminNavGroups, employeeNavGroups, IND } = useMemo(() => buildNavGroups(currentIndustrySlug), [currentIndustrySlug])

  const [role, setRole] = useState<'admin' | 'employee'>('employee')
  const [userName, setUserName] = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const [userCompany, setUserCompany] = useState('GK Digital')
  const [activeIndustries, setActiveIndustries] = useState<string[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [totalLeads, setTotalLeads] = useState(0)
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false)
  const [empPermissions, setEmpPermissions] = useState<string[]>(['pipeline'])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'PIPELINE': true, 'MY PIPELINE': true, 'PROJECTS': false,
    'HR & ADMIN': false, 'FINANCE': false, 'SYSTEM': false, 'ACCOUNT': true,
  })

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles').select('full_name, role, company_id').eq('id', user.id).single()
        if (profile) {
          const isAdmin = ['admin', 'tenant_admin', 'manager'].includes(profile.role)
          setRole(isAdmin ? 'admin' : 'employee')
          if (profile.full_name) {
            setUserName(profile.full_name)
            const parts = profile.full_name.trim().split(' ')
            setUserInitials(parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase())
          }
          if (profile.company_id) {
            const { data: company } = await supabase.from('companies').select('name').eq('id', profile.company_id).single()
            if (company?.name) setUserCompany(company.name)
            const { data: ci } = await supabase.from('company_industries').select('industries(slug)').eq('company_id', profile.company_id).eq('is_active', true)
            if (ci) setActiveIndustries(ci.map((c: any) => c.industries?.slug).filter(Boolean))

            const { data: leads } = await supabase
              .from('leads')
              .select('pipeline_stage, notes')
              .eq('company_id', profile.company_id)
              .eq('industry', 'interior-design')
            if (leads) {
              const counts: Record<string, number> = {}
              leads.forEach(l => {
                const s = l.pipeline_stage || 'new'
                // RNR = followup stage with [RNR] tag in notes
                if (s === 'followup' && String(l.notes || '').startsWith('[RNR]')) {
                  counts['rnr'] = (counts['rnr'] || 0) + 1
                } else {
                  counts[s] = (counts[s] || 0) + 1
                }
              })
              setStageCounts(counts)
              setTotalLeads(leads.length)
            }
          }
          if (!isAdmin) {
            const { data: empData } = await supabase.from('employees').select('permissions').eq('user_id', user.id).maybeSingle()
            if (empData?.permissions && Array.isArray(empData.permissions)) {
              setEmpPermissions(empData.permissions)
            } else {
              const { data: empByEmail } = await supabase.from('employees').select('permissions').eq('email', user.email!).maybeSingle()
              if (empByEmail?.permissions && Array.isArray(empByEmail.permissions)) setEmpPermissions(empByEmail.permissions)
            }
          }
        }
      } catch (err) { console.error('Sidebar init:', err) }
    }
    init()
  }, [pathname])

  useEffect(() => {
    const channel = supabase.channel(`sidebar-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return
        const { data: leads } = await supabase
          .from('leads')
          .select('pipeline_stage, notes')
          .eq('company_id', profile.company_id)
          .eq('industry', 'interior-design')
        if (!leads) return
        const counts: Record<string, number> = {}
        leads.forEach(l => {
          const s = l.pipeline_stage || 'new'
          if (s === 'followup' && String(l.notes || '').startsWith('[RNR]')) {
            counts['rnr'] = (counts['rnr'] || 0) + 1
          } else {
            counts[s] = (counts[s] || 0) + 1
          }
        })
        setStageCounts(counts)
        setTotalLeads(leads.length)
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setIndustryDropdownOpen(false)
    if (industryDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [industryDropdownOpen])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  const navGroups = useMemo(() => {
    if (role === 'admin') return adminNavGroups
    return employeeNavGroups.filter(group => {
      if (group.section === 'ACCOUNT') return true
      const requiredPerm = SECTION_PERMISSION[group.section]
      if (!requiredPerm) return false
      return empPermissions.includes(requiredPerm)
    })
  }, [role, adminNavGroups, employeeNavGroups, empPermissions])

  const getBadge = (href: string) => {
    const IND_BASE = `/dashboard/industries/${currentIndustrySlug}`
    const stageMap: Record<string, string> = {
      [`${IND_BASE}/new-leads`]:  'new',
      [`${IND_BASE}/follow-up`]:  'followup',
      [`${IND_BASE}/rnr`]:        'rnr',
      [`${IND_BASE}/site-visit`]: 'sitevisit',
      [`${IND_BASE}/quotations`]: 'quotation',
      [`${IND_BASE}/won`]:        'won',
      [`${IND_BASE}/lost`]:       'lost',
      [`${IND_BASE}/all-leads`]:  '__total__',
    }
    const stageKey = stageMap[href]
    if (!stageKey) return null
    const c = stageKey === '__total__' ? totalLeads : stageCounts[stageKey]
    return c ? String(c) : null
  }

  const isActive = (href: string) => {
    if (href === `/dashboard/industries/${currentIndustrySlug}`) return pathname === href
    return pathname.startsWith(href)
  }

  const handleIndustrySwitch = (slug: string) => {
    localStorage.setItem('gk-active-industry', slug)
    setCurrentIndustrySlug(slug)
  }

  const toggleSection = (section: string) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))

  const AVATAR_COLORS = [
    { from: '#7C3AED', to: '#4F46E5' },
    { from: '#0891B2', to: '#0E7490' },
    { from: '#059669', to: '#047857' },
    { from: '#D97706', to: '#B45309' },
    { from: '#DB2777', to: '#BE185D' },
  ]
  const avatarColor = AVATAR_COLORS[userInitials.charCodeAt(0) % AVATAR_COLORS.length]

  const PERM_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    pipeline: { label: 'Pipeline', color: '#7C3AED', bg: '#F5F3FF' },
    projects: { label: 'Projects', color: '#EA580C', bg: '#FFF7ED' },
    hr:       { label: 'HR',       color: '#0284C7', bg: '#EFF6FF' },
    finance:  { label: 'Finance',  color: '#16A34A', bg: '#F0FDF4' },
  }

  const getBadgeStyle = (href: string, active: boolean): React.CSSProperties => {
    if (active) return { background: 'rgba(255,255,255,0.22)', color: '#fff' }
    if (href.includes('/follow-up')) return { background: '#FEF3C7', color: '#B45309' }
    if (href.includes('/rnr'))       return { background: '#FEE2E2', color: '#DC2626' }
    if (href.includes('/won'))       return { background: '#DCFCE7', color: '#15803D' }
    if (href.includes('/lost'))      return { background: '#FEE2E2', color: '#DC2626' }
    return { background: '#F0F0EE', color: '#888' }
  }

  return (
    <>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, backdropFilter: 'blur(4px)' }}
          className="lg:hidden" onClick={onClose} />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: 236, maxWidth: '82vw', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        background: '#FFFFFF', borderRight: '1px solid #EBEBEB',
        boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', sans-serif",
        paddingTop: 'env(safe-area-inset-top)',
      }} className="lg:translate-x-0">

        {/* LOGO */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: 'linear-gradient(135deg,#F5C518,#E0A800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#1C1C1E', boxShadow: '0 4px 12px rgba(245,197,24,0.4)' }}>G</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1E', margin: 0, letterSpacing: -0.3 }}>GK · CRM</p>
              <p style={{ fontSize: 9, fontWeight: 400, color: '#F5C518', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Premium Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden"
            style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F3', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888' }}>
            <X size={16} />
          </button>
        </div>

        {/* INDUSTRY CHIP */}
        <div style={{ padding: '0 12px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9F9F7', border: '1px solid #EBEBEB', borderRadius: 16, padding: '10px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid #F0F0EE', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {currentIndustry.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, margin: 0 }}>{currentIndustry.label}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1E', margin: '2px 0 0' }}>
                {role === 'admin' ? '👑 Admin Portal' : '👤 User Portal'}
              </p>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.5)', flexShrink: 0 }} />
          </div>

          {activeIndustries.length > 1 && (
            <div style={{ position: 'relative', marginTop: 8 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setIndustryDropdownOpen(prev => !prev)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F3', border: '1px solid #EBEBEB', borderRadius: 12, padding: '11px 12px', fontSize: 11, fontWeight: 600, color: '#1C1C1E', cursor: 'pointer' }}>
                <span style={{ fontSize: 13 }}>{currentIndustry.icon}</span>
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentIndustry.label}</span>
                <ChevronDown size={11} style={{ color: '#AAA', transform: industryDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              {industryDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #EBEBEB', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden' }}>
                  {activeIndustries.map(slug => {
                    const ind = INDUSTRIES[slug]; if (!ind) return null
                    const isCurrent = slug === currentIndustrySlug
                    return (
                      <Link key={slug} href={`/dashboard/industries/${slug}/dashboard`}
                        onClick={() => { handleIndustrySwitch(slug); setIndustryDropdownOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', fontSize: 11, fontWeight: 600, background: isCurrent ? '#1C1C1E' : 'transparent', color: isCurrent ? '#fff' : '#666', textDecoration: 'none' }}>
                        <span style={{ fontSize: 14 }}>{ind.icon}</span>
                        <span style={{ flex: 1 }}>{ind.label}</span>
                        {isCurrent && <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: 20, fontWeight: 800, letterSpacing: 1 }}>ACTIVE</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#EBEBEB,transparent)', margin: '0 12px', flexShrink: 0 }} />

        {/* NAV */}
        <nav style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }} className="scroll-hide">

          {role === 'employee' && empPermissions.length > 0 && (
            <div style={{ padding: '4px 6px 10px' }}>
              <p style={{ fontSize: 8, fontWeight: 800, color: '#BBB', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Your Access</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {empPermissions.map(pId => {
                  const p = PERM_LABELS[pId]; if (!p) return null
                  return <span key={pId} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: p.bg, color: p.color }}>{p.label}</span>
                })}
              </div>
            </div>
          )}

          {navGroups.map((group) => {
            const isOpen_ = openSections[group.section] ?? true
            const hasActive = group.items.some(item => isActive(item.href))
            return (
              <div key={group.section} style={{ marginBottom: 2 }}>
                <button onClick={() => toggleSection(group.section)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px', borderRadius: 12, border: 'none', background: hasActive ? '#F5F5F3' : 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13 }}>{group.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 9, fontWeight: 800, color: '#BBB', textTransform: 'uppercase', letterSpacing: 2 }}>{group.section}</span>
                  <ChevronDown size={11} style={{ color: '#CCC', transform: isOpen_ ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>

                <div style={{ overflow: 'hidden', maxHeight: isOpen_ ? 600 : 0, opacity: isOpen_ ? 1 : 0, transition: 'max-height 0.22s ease, opacity 0.18s ease' }}>
                  <div style={{ paddingTop: 2, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      const badge = getBadge(item.href)
                      return (
                        <Link key={item.label} href={item.href} onClick={onClose}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 9, padding: '11px 10px', borderRadius: 12,
                            background: active ? '#1C1C1E' : 'transparent',
                            color: active ? '#fff' : '#555',
                            fontWeight: active ? 700 : 500,
                            fontSize: 12, textDecoration: 'none',
                            boxShadow: active ? '0 2px 10px rgba(0,0,0,0.12)' : 'none',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F5F3' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                          <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          {badge && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, flexShrink: 0, ...getBadgeStyle(item.href, active) }}>
                              {badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#EBEBEB,transparent)', margin: '0 12px', flexShrink: 0 }} />

        {/* USER FOOTER */}
        <div style={{ padding: '12px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9F9F7', border: '1px solid #EBEBEB', borderRadius: 16, padding: '10px 12px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: `linear-gradient(135deg,${avatarColor.from},${avatarColor.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {userInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName.split(' ')[0]}</p>
                <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0, background: role === 'admin' ? '#FEF9C3' : '#EFF6FF', color: role === 'admin' ? '#B45309' : '#2563EB' }}>
                  {role === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
              <p style={{ fontSize: 10, color: '#BBB', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userCompany}</p>
            </div>
            <button onClick={handleLogout}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #EBEBEB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#BBB', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#BBB' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .scroll-hide { scrollbar-width: none; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        @media (min-width: 1024px) { .lg\\:translate-x-0 { transform: translateX(0) !important; } .lg\\:hidden { display: none !important; } }
      `}</style>
    </>
  )
}