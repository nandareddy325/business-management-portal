'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X, ChevronDown, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SidebarProps { isOpen: boolean; onClose: () => void }

const INDUSTRIES: Record<string, { label: string; icon: string; slug: string }> = {
  'interior-design': { label: 'Interior Design', icon: '🛋️', slug: 'interior-design' },
  'real-estate':     { label: 'Real Estate',     icon: '🏠', slug: 'real-estate' },
  'hospital':        { label: 'Hospital',         icon: '🏥', slug: 'hospital' },
  'b2b-business':    { label: 'B2B Business',    icon: '🤝', slug: 'b2b-business' },
  'clinics':         { label: 'Clinics',          icon: '🩺', slug: 'clinics' },
}

function buildNavGroups(industrySlug: string) {
  const IND = `/dashboard/industries/${industrySlug}`
  const adminNavGroups = [
    {
      section: 'PIPELINE', icon: '🎯',
      items: [
        { label: 'Lead Pipeline', icon: '🎯', href: IND,                        stage: 'all' },
        { label: 'Follow Ups',   icon: '🔄', href: `${IND}?stage=followup`,  stage: 'followup' },
        { label: 'Site Visits',  icon: '🏠', href: `${IND}?stage=sitevisit`, stage: 'sitevisit' },
        { label: 'Quotations',   icon: '💰', href: `${IND}?stage=quotation`, stage: 'quotation' },
        { label: 'Won / Closed', icon: '✅', href: `${IND}?stage=won`,       stage: 'won' },
        { label: 'Lost',         icon: '❌', href: `${IND}?stage=lost`,      stage: 'lost' },
      ],
    },
    {
      section: 'PROJECTS', icon: '🏗️',
      items: [
        { label: 'All Projects', icon: '🏗️', href: `${IND}/projects`,  stage: null },
        { label: 'Clients',      icon: '👥', href: `${IND}/clients`,   stage: null },
        { label: 'Designs',      icon: '🎨', href: `${IND}/designs`,   stage: null },
        { label: 'Materials',    icon: '📦', href: `${IND}/materials`, stage: null },
      ],
    },
    {
      section: 'HR & ADMIN', icon: '👔',
      items: [
        { label: 'HRMS',       icon: '👔', href: '/hr/employees',  stage: null },
        { label: 'Attendance', icon: '📅', href: '/hr/attendance', stage: null },
      ],
    },
    {
      section: 'FINANCE', icon: '💳',
      items: [
        { label: 'Invoices', icon: '🧾', href: '/billing/invoices', stage: null },
        { label: 'Payments', icon: '💳', href: '/billing/payments', stage: null },
        { label: 'Reports',  icon: '📊', href: '/reports',          stage: null },
      ],
    },
    {
      section: 'SYSTEM', icon: '⚙️',
      items: [
        { label: 'Settings', icon: '⚙️', href: '/dashboard/settings', stage: null },
      ],
    },
  ]
  const userNavGroups = [
    {
      section: 'MY PIPELINE', icon: '🎯',
      items: [
        { label: 'My Leads',    icon: '🎯', href: IND,                        stage: 'all' },
        { label: 'Follow Ups',  icon: '🔄', href: `${IND}?stage=followup`,  stage: 'followup' },
        { label: 'Site Visits', icon: '🏠', href: `${IND}?stage=sitevisit`, stage: 'sitevisit' },
        { label: 'Quotations',  icon: '💰', href: `${IND}?stage=quotation`, stage: 'quotation' },
        { label: 'Won',         icon: '✅', href: `${IND}?stage=won`,       stage: 'won' },
      ],
    },
    {
      section: 'WORK', icon: '💼',
      items: [
        { label: 'My Projects', icon: '🏗️', href: '/crm/leads',    stage: null },
        { label: 'Attendance',  icon: '📅', href: '/hr/attendance', stage: null },
      ],
    },
  ]
  return { adminNavGroups, userNavGroups, IND }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
  const { adminNavGroups, userNavGroups, IND } = useMemo(() => buildNavGroups(currentIndustrySlug), [currentIndustrySlug])

  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [userName, setUserName] = useState('User')
  const [userInitials, setUserInitials] = useState('U')
  const [userCompany, setUserCompany] = useState('GK Digital')
  const [activeIndustries, setActiveIndustries] = useState<string[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [totalLeads, setTotalLeads] = useState(0)
  const [wonLeads, setWonLeads] = useState(0)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'PIPELINE': true, 'MY PIPELINE': true, 'PROJECTS': false,
    'HR & ADMIN': false, 'FINANCE': false, 'SYSTEM': false, 'WORK': true,
  })

  // Sync activeStage from URL searchParams
  useEffect(() => {
    const urlStage = searchParams.get('stage')
    setActiveStage(urlStage || 'all')
  }, [searchParams])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).single()
        if (profile) {
          const r = (['admin', 'tenant_admin', 'manager'].includes(profile.role)) ? 'admin' : 'user'
          setRole(r)
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
            const { data: leads } = await supabase.from('leads').select('pipeline_stage').eq('company_id', profile.company_id)
            if (leads) {
              const counts: Record<string, number> = {}
              leads.forEach(l => { const s = l.pipeline_stage || 'new'; counts[s] = (counts[s] || 0) + 1 })
              setStageCounts(counts); setTotalLeads(leads.length); setWonLeads(counts['won'] || 0)
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
        const { data: leads } = await supabase.from('leads').select('pipeline_stage').eq('company_id', profile.company_id)
        if (!leads) return
        const counts: Record<string, number> = {}
        leads.forEach(l => { const s = l.pipeline_stage || 'new'; counts[s] = (counts[s] || 0) + 1 })
        setStageCounts(counts); setTotalLeads(leads.length); setWonLeads(counts['won'] || 0)
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
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const navGroups = useMemo(() => role === 'admin' ? adminNavGroups : userNavGroups, [role, adminNavGroups, userNavGroups])

  const getBadge = (stage: string | null) => {
    if (!stage || stage === 'all') return totalLeads > 0 ? String(totalLeads) : null
    const c = stageCounts[stage]; return c ? String(c) : null
  }

  const isActive = (href: string, stage: string | null) => {
    const hrefPath = href.split('?')[0]
    // Non-IND pages
    if (hrefPath !== IND) {
      return pathname.startsWith(hrefPath) && hrefPath !== IND
    }
    // IND page — use activeStage state (no window)
    if (!pathname.startsWith(IND)) return false
    if (stage === 'all') return activeStage === 'all' || activeStage === null
    return activeStage === stage
  }

  const handleNavClick = (stage: string | null, href: string) => {
    if (href === IND) {
      setActiveStage(stage)
      setTimeout(() => window.dispatchEvent(new CustomEvent('sidebar-stage-change', { detail: { stage } })), 100)
    }
    onClose()
  }

  const handleIndustrySwitch = (slug: string) => {
    localStorage.setItem('gk-active-industry', slug)
    setCurrentIndustrySlug(slug)
  }

  const toggleSection = (section: string) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))

  const getGradient = (i: string) => {
    const g = ['from-violet-500 to-purple-700', 'from-blue-500 to-cyan-700', 'from-emerald-500 to-teal-700', 'from-amber-500 to-orange-600', 'from-pink-500 to-rose-700', 'from-indigo-500 to-blue-700']
    return g[i.charCodeAt(0) % g.length]
  }

  const badgeStyle = (stage: string | null, active: boolean) => {
    if (active) return 'bg-white/25 text-white'
    if (stage === 'followup') return 'bg-amber-100 text-amber-700'
    if (stage === 'won') return 'bg-emerald-100 text-emerald-700'
    if (stage === 'lost') return 'bg-red-100 text-red-600'
    return 'bg-[#E8E2D8] text-[#7A6E60]'
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-full w-[228px] z-50 flex flex-col
        bg-[#FEFCF8] border-r border-[#DDD5C4]
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>

        {/* ── LOGO ── */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-orange-200">
              G
            </div>
            <div>
              <p className="font-serif text-[15px] text-[#1C1712] tracking-wide leading-none">GK · CRM</p>
              <p className="text-[8px] text-[#B8860B] uppercase tracking-[2.5px] font-bold mt-0.5">Premium Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden w-7 h-7 rounded-lg bg-[#F0EBE0] flex items-center justify-center text-[#7A6E60] hover:bg-[#E8E0D0] transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* ── INDUSTRY SECTION ── */}
        <div className="px-3 pb-3 flex-shrink-0">
          {/* Active industry card */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#F5F0E8] to-[#F0EBE0] border border-[#DDD5C4] rounded-2xl px-3 py-2.5 shadow-sm">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-base shadow-sm border border-[#E8E2D8] flex-shrink-0">
              {currentIndustry.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] text-[#B8A99A] uppercase tracking-widest font-bold">{currentIndustry.label}</p>
              <p className="text-[11px] text-[#1C1712] font-semibold mt-0.5">
                {role === 'admin' ? '👑 Admin Portal' : '👤 User Portal'}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200 animate-pulse" />
            </div>
          </div>

          {/* Industry dropdown */}
          {activeIndustries.length > 1 && (
            <div className="relative mt-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setIndustryDropdownOpen(prev => !prev)}
                className="w-full flex items-center gap-2 bg-[#F5F0E8] border border-[#DDD5C4] rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1C1712] hover:bg-[#EDE8DF] transition-colors"
              >
                <span className="text-sm">{currentIndustry.icon}</span>
                <span className="flex-1 text-left truncate">{currentIndustry.label}</span>
                <ChevronDown size={11} className={`text-[#7A6E60] transition-transform duration-200 ${industryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {industryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDD5C4] rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden">
                  {activeIndustries.map((slug) => {
                    const ind = INDUSTRIES[slug]
                    if (!ind) return null
                    const isCurrent = slug === currentIndustrySlug
                    return (
                      <Link
                        key={slug}
                        href={`/dashboard/industries/${slug}`}
                        onClick={() => { handleIndustrySwitch(slug); setIndustryDropdownOpen(false) }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-semibold transition-colors ${
                          isCurrent ? 'bg-[#1C1712] text-white' : 'text-[#7A6E60] hover:bg-[#F5F0E8] hover:text-[#1C1712]'
                        }`}
                      >
                        <span className="text-sm">{ind.icon}</span>
                        <span className="flex-1">{ind.label}</span>
                        {isCurrent && <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full font-bold tracking-wide">ACTIVE</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* thin divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#DDD5C4] to-transparent mx-3 flex-shrink-0" />

        {/* ── NAV ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navGroups.map((group) => {
            const isOpen_ = openSections[group.section] ?? true
            const hasActive = group.items.some(item => isActive(item.href, item.stage))
            return (
              <div key={group.section} className="mb-1">
                <button
                  onClick={() => toggleSection(group.section)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${hasActive ? 'bg-[#EDE8DF]' : 'hover:bg-[#F5F0E8]'}`}
                >
                  <span className="text-[13px]">{group.icon}</span>
                  <span className="flex-1 text-[9px] font-black text-[#A89F94] uppercase tracking-[2px] text-left">{group.section}</span>
                  <ChevronDown size={11} className={`text-[#C4BAB0] transition-transform duration-200 flex-shrink-0 ${isOpen_ ? 'rotate-0' : '-rotate-90'}`} />
                </button>

                <div className={`overflow-hidden transition-all duration-200 ${isOpen_ ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-0.5 pt-0.5 pl-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href, item.stage)
                      const badge = getBadge(item.stage)
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => handleNavClick(item.stage, item.href)}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-[12px]
                            ${active
                              ? 'bg-[#1C1712] text-white font-semibold shadow-md shadow-black/10'
                              : 'text-[#7A6E60] hover:text-[#1C1712] hover:bg-[#EDE8DF]'
                            }
                          `}
                        >
                          <span className="text-[13px] leading-none flex-shrink-0">{item.icon}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeStyle(item.stage, active)}`}>
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

        {/* thin divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#DDD5C4] to-transparent mx-3 flex-shrink-0" />

        {/* ── PIPELINE HEALTH ── */}
        {role === 'admin' && (
          <div className="px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[8px] font-black text-[#A89F94] uppercase tracking-[2px]">Pipeline Health</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${winRate > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F0EBE0] text-[#9A8F82]'}`}>
                {winRate}% win
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'New',        stage: 'new',       color: 'bg-slate-400' },
                { label: 'Follow Up',  stage: 'followup',  color: 'bg-amber-400' },
                { label: 'Site Visit', stage: 'sitevisit', color: 'bg-orange-400' },
                { label: 'Won',        stage: 'won',       color: 'bg-emerald-500' },
              ].map(item => {
                const count = stageCounts[item.stage] || 0
                const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <p className="text-[9px] text-[#A89F94] w-14 flex-shrink-0 truncate">{item.label}</p>
                    <div className="flex-1 h-1 bg-[#EDE8DF] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-[#A89F94] w-3 text-right flex-shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* thin divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#DDD5C4] to-transparent mx-3 flex-shrink-0" />

        {/* ── FOOTER ── */}
        <div className="px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 bg-[#F5F0E8] border border-[#DDD5C4] rounded-xl px-3 py-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getGradient(userInitials)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm`}>
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-[#1C1712] truncate">{userName.split(' ')[0]}</p>
                {role === 'admin' && (
                  <span className="text-[7px] font-black bg-[#B8860B]/15 text-[#B8860B] px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[9px] text-[#9A8F82] truncate">{userCompany}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg bg-white border border-[#DDD5C4] flex items-center justify-center text-[#9A8F82] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex-shrink-0"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}