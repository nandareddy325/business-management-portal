'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

const clients = [
  { id: '1', company: 'TechCorp Solutions', contact: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@techcorp.com', industry: 'IT Services', value: '₹12.5L', status: 'active', since: 'Jan 2025' },
  { id: '2', company: 'Reddy Constructions', contact: 'Suresh Reddy', phone: '+91 87654 32109', email: 'suresh@reddycon.com', industry: 'Construction', value: '₹28L', status: 'active', since: 'Mar 2024' },
  { id: '3', company: 'MK Pharma Ltd', contact: 'Meena Kumari', phone: '+91 76543 21098', email: 'meena@mkpharma.com', industry: 'Pharma', value: '₹8.5L', status: 'negotiation', since: 'Jun 2026' },
  { id: '4', company: 'Global Exports Pvt', contact: 'Harpreet Singh', phone: '+91 65432 10987', email: 'harpreet@globalex.com', industry: 'Exports', value: '₹45L', status: 'active', since: 'Nov 2023' },
  { id: '5', company: 'Sunrise Hotels', contact: 'Anita Verma', phone: '+91 54321 09876', email: 'anita@sunrise.com', industry: 'Hospitality', value: '₹15L', status: 'at-risk', since: 'Feb 2025' },
  { id: '6', company: 'Digital Wave Agency', contact: 'Vinod Patel', phone: '+91 43210 98765', email: 'vinod@digitalwave.com', industry: 'Marketing', value: '₹6L', status: 'new', since: 'Jun 2026' },
]

const deals = [
  { id: '1', title: 'TechCorp — Annual IT Support', client: 'TechCorp Solutions', value: '₹12.5L', stage: 'closed-won', probability: 100, owner: 'Ghana K.', closeDate: '01 Jun 2026' },
  { id: '2', title: 'MK Pharma — ERP Implementation', client: 'MK Pharma Ltd', value: '₹8.5L', stage: 'proposal', probability: 60, owner: 'Ravi K.', closeDate: '30 Jun 2026' },
  { id: '3', title: 'Sunrise Hotels — CRM Setup', client: 'Sunrise Hotels', value: '₹4.2L', stage: 'negotiation', probability: 75, owner: 'Ghana K.', closeDate: '15 Jun 2026' },
  { id: '4', title: 'Digital Wave — SEO Package', client: 'Digital Wave Agency', value: '₹1.8L', stage: 'discovery', probability: 30, owner: 'Anjali S.', closeDate: '31 Jul 2026' },
  { id: '5', title: 'Global Exports — Logistics Software', client: 'Global Exports Pvt', value: '₹22L', stage: 'closed-won', probability: 100, owner: 'Ghana K.', closeDate: '15 May 2026' },
  { id: '6', title: 'Reddy Con — Project Management', client: 'Reddy Constructions', value: '₹6.5L', stage: 'negotiation', probability: 80, owner: 'Ravi K.', closeDate: '20 Jun 2026' },
]

const invoices = [
  { id: 'INV-B001', client: 'TechCorp Solutions', amount: 312500, paid: 312500, status: 'paid', date: '01 Jun 2026', due: '15 Jun 2026', service: 'IT Support — Q2 2026' },
  { id: 'INV-B002', client: 'Global Exports Pvt', amount: 550000, paid: 275000, status: 'partial', date: '15 May 2026', due: '29 May 2026', service: 'Logistics Software License' },
  { id: 'INV-B003', client: 'Reddy Constructions', amount: 162500, paid: 0, status: 'overdue', date: '01 May 2026', due: '15 May 2026', service: 'Project Management Tool' },
  { id: 'INV-B004', client: 'Sunrise Hotels', amount: 105000, paid: 105000, status: 'paid', date: '03 Jun 2026', due: '17 Jun 2026', service: 'CRM Setup — Phase 1' },
  { id: 'INV-B005', client: 'MK Pharma Ltd', amount: 212500, paid: 0, status: 'pending', date: '03 Jun 2026', due: '17 Jun 2026', service: 'ERP Consultation' },
]

const activities = [
  { id: '1', type: 'call', client: 'TechCorp Solutions', action: 'Follow-up call scheduled', person: 'Rajesh Kumar', time: '2h ago' },
  { id: '2', type: 'email', client: 'MK Pharma Ltd', action: 'Proposal sent via email', person: 'Meena Kumari', time: '4h ago' },
  { id: '3', type: 'meeting', client: 'Sunrise Hotels', action: 'Demo meeting completed', person: 'Anita Verma', time: '1d ago' },
  { id: '4', type: 'deal', client: 'Global Exports Pvt', action: 'Deal closed — ₹22L', person: 'Harpreet Singh', time: '2d ago' },
  { id: '5', type: 'invoice', client: 'Reddy Constructions', action: 'Invoice overdue reminder sent', person: 'Suresh Reddy', time: '3d ago' },
]

const pipeline = [
  { stage: 'Discovery', count: 1, value: '₹1.8L', color: 'bg-blue-500', hex: '#60A5FA', pct: 10 },
  { stage: 'Proposal', count: 1, value: '₹8.5L', color: 'bg-purple-500', hex: '#C084FC', pct: 25 },
  { stage: 'Negotiation', count: 2, value: '₹10.7L', color: 'bg-amber-500', hex: '#FBBF24', pct: 55 },
  { stage: 'Closed Won', count: 2, value: '₹34.5L', color: 'bg-emerald-500', hex: '#34D399', pct: 100 },
]

const statusBadge: Record<string, string> = {
  active:       'bg-emerald-500/10 text-emerald-400',
  negotiation:  'bg-amber-500/10 text-amber-400',
  'at-risk':    'bg-red-500/10 text-red-400',
  new:          'bg-blue-500/10 text-blue-400',
  'closed-won': 'bg-emerald-500/10 text-emerald-400',
  'closed-lost':'bg-red-500/10 text-red-400',
  proposal:     'bg-purple-500/10 text-purple-400',
  discovery:    'bg-blue-500/10 text-blue-400',
  paid:         'bg-emerald-500/10 text-emerald-400',
  partial:      'bg-amber-500/10 text-amber-400',
  overdue:      'bg-red-500/10 text-red-400',
  pending:      'bg-blue-500/10 text-blue-400',
}

const activityIcon: Record<string, { icon: string; color: string }> = {
  call:    { icon: '📞', color: 'text-blue-400' },
  email:   { icon: '📧', color: 'text-purple-400' },
  meeting: { icon: '🤝', color: 'text-amber-400' },
  deal:    { icon: '💰', color: 'text-emerald-400' },
  invoice: { icon: '📄', color: 'text-red-400' },
}

const avatarColors = [
  { bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  { bg: 'bg-emerald-500/10',text: 'text-emerald-400' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { bg: 'bg-amber-500/10',  text: 'text-amber-400' },
  { bg: 'bg-red-500/10',    text: 'text-red-400' },
  { bg: 'bg-pink-500/10',   text: 'text-pink-400' },
]

const pipelineStageStyle: Record<string, { border: string; text: string }> = {
  'Discovery':   { border: 'border-blue-400',   text: 'text-blue-400' },
  'Proposal':    { border: 'border-purple-400',  text: 'text-purple-400' },
  'Negotiation': { border: 'border-amber-400',   text: 'text-amber-400' },
  'Closed Won':  { border: 'border-emerald-400', text: 'text-emerald-400' },
}

const tabs = ['Overview', 'Clients', 'Deals', 'Pipeline', 'Invoices', 'Activities']

export default function B2BDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('user')
  const [search, setSearch] = useState('')
  const [dealFilter, setDealFilter] = useState('All')
  const [clientFilter, setClientFilter] = useState('All')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?industry=b2b-business'); return }

      // Set email from auth
      setUserEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
      if (profile?.role)      setUserRole(profile.role)
    }
    getUser()
  }, [router])

  const activeClients = clients.filter(c => c.status === 'active')
  const openDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage))
  const closedDeals = deals.filter(d => d.stage === 'closed-won')
  const overdueInvoices = invoices.filter(i => i.status === 'overdue')

  const filteredClients = clients.filter(c => {
    const matchSearch = c.company.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase())
    const matchFilter = clientFilter === 'All' || c.status === clientFilter.toLowerCase().replace(' ', '-')
    return matchSearch && matchFilter
  })

  const filteredDeals = deals.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.client.toLowerCase().includes(search.toLowerCase())
    const matchFilter = dealFilter === 'All' || d.stage === dealFilter.toLowerCase().replace(' ', '-')
    return matchSearch && matchFilter
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearch('')
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-[220px] flex flex-col min-w-0">
        {/* ✅ FIX: All three required props now passed */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          title="B2B Business"
          subtitle="CRM Portal"
        />
        <main className="flex-1 p-5 md:p-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl text-[#F1F5F9]">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-sm text-[#475569] mt-1">B2B Business CRM Portal</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-4 py-2 rounded-xl">
                <span className="text-xl">🤝</span>
                <div>
                  <p className="text-[10px] text-[#475569] uppercase tracking-wide">Industry</p>
                  <p className="text-[13px] font-semibold text-[#C9A84C]">B2B Business</p>
                </div>
              </div>
              <button className="bg-[#C9A84C] text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b89640] transition-colors">
                + Add Client
              </button>
              <button className="border border-white/10 text-[#94A3B8] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                + New Deal
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
            {[
              { label: 'Total Clients',  value: `${clients.length}`,        change: `${activeClients.length} active`,  icon: '🏢', iconBg: 'bg-blue-500/10',    valColor: 'text-blue-400',    tab: 'Clients' },
              { label: 'Open Deals',     value: `${openDeals.length}`,      change: 'In progress',                     icon: '🎯', iconBg: 'bg-amber-500/10',   valColor: 'text-amber-400',   tab: 'Deals' },
              { label: 'Closed Deals',   value: `${closedDeals.length}`,    change: 'This month',                      icon: '✅', iconBg: 'bg-emerald-500/10', valColor: 'text-emerald-400', tab: 'Deals' },
              { label: 'Pipeline',       value: '₹21L',                     change: 'Total open value',                icon: '📊', iconBg: 'bg-purple-500/10',  valColor: 'text-purple-400',  tab: 'Pipeline' },
              { label: 'Overdue',        value: `${overdueInvoices.length}`,change: 'Invoice overdue',                 icon: '⚠️', iconBg: 'bg-red-500/10',     valColor: 'text-red-400',     tab: 'Invoices' },
              { label: 'Revenue',        value: '₹15.6L',                   change: '+28% this month',                 icon: '₹',  iconBg: 'bg-[#C9A84C]/10',   valColor: 'text-[#C9A84C]',  tab: 'Invoices' },
            ].map((stat) => (
              <div
                key={stat.label}
                onClick={() => handleTabChange(stat.tab)}
                className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4 hover:-translate-y-0.5 hover:border-[#C9A84C]/30 hover:bg-[#141d2e] transition-all cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center text-base mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-xs text-[#475569] font-medium">{stat.label}</p>
                <p className={`font-serif text-[24px] my-1 leading-none ${stat.valColor}`}>{stat.value}</p>
                <p className="text-[10px] text-[#334155]">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Tab Bar */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#C9A84C] text-[#0A0F1E]'
                    : 'bg-[#111827] border border-white/[0.07] text-[#475569] hover:bg-white/5 hover:text-[#94A3B8]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Top Clients */}
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#F1F5F9]">Top Clients</h3>
                  <button onClick={() => handleTabChange('Clients')} className="text-xs text-[#C9A84C] hover:underline">View All →</button>
                </div>
                <div className="flex flex-col gap-1">
                  {clients.slice(0, 4).map((client, i) => (
                    <div key={client.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length].bg} ${avatarColors[i % avatarColors.length].text}`}>
                        {client.company.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#CBD5E1] truncate">{client.company}</p>
                        <p className="text-xs text-[#475569]">{client.industry}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#F1F5F9]">{client.value}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge[client.status]}`}>{client.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Deals */}
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#F1F5F9]">Active Deals</h3>
                  <button onClick={() => handleTabChange('Deals')} className="text-xs text-[#C9A84C] hover:underline">View All →</button>
                </div>
                <div className="flex flex-col gap-3">
                  {deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).map((deal) => (
                    <div key={deal.id} className="p-3 bg-[#0D1425] border border-white/[0.06] rounded-xl">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-sm font-medium text-[#CBD5E1] truncate flex-1">{deal.title}</p>
                        <span className="text-sm font-semibold text-[#F1F5F9] ml-2 flex-shrink-0">{deal.value}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#475569] mb-2">
                        <span>{deal.client}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${statusBadge[deal.stage]}`}>{deal.stage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className="text-[10px] text-[#475569]">{deal.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Summary */}
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#F1F5F9]">Pipeline Summary</h3>
                  <button onClick={() => handleTabChange('Pipeline')} className="text-xs text-[#C9A84C] hover:underline">View Full →</button>
                </div>
                <div className="flex flex-col gap-3">
                  {pipeline.map((stage) => (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <p className="text-sm text-[#94A3B8] w-24 flex-shrink-0">{stage.stage}</p>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${stage.pct}%` }} />
                      </div>
                      <div className="text-right w-20 flex-shrink-0">
                        <p className="text-xs font-semibold text-[#F1F5F9]">{stage.value}</p>
                        <p className="text-[10px] text-[#475569]">{stage.count} deals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#F1F5F9]">Recent Activities</h3>
                  <button onClick={() => handleTabChange('Activities')} className="text-xs text-[#C9A84C] hover:underline">View All →</button>
                </div>
                <div className="flex flex-col gap-1">
                  {activities.slice(0, 4).map((act) => (
                    <div key={act.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 bg-[#0D1425] border border-white/[0.07] rounded-lg flex items-center justify-center text-base flex-shrink-0">
                        {activityIcon[act.type].icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#CBD5E1] truncate">{act.action}</p>
                        <p className="text-xs text-[#475569]">{act.client} — {act.person}</p>
                      </div>
                      <p className="text-[11px] text-[#334155] flex-shrink-0">{act.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CLIENTS ───────────────────────────────────────────────────── */}
          {activeTab === 'Clients' && (
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Active', 'Negotiation', 'At-risk', 'New'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setClientFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        clientFilter === f
                          ? 'bg-[#C9A84C] text-[#0A0F1E]'
                          : 'bg-white/5 border border-white/[0.07] text-[#475569] hover:text-[#94A3B8]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-[#0D1425] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#CBD5E1] placeholder-[#334155] outline-none focus:border-[#C9A84C]/50 w-48 transition-colors"
                  />
                  <button className="bg-[#C9A84C] text-[#0A0F1E] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-[#b89640] transition-colors">
                    + Add Client
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Company', 'Contact', 'Industry', 'Contract Value', 'Since', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wider font-semibold text-[#334155] uppercase pb-3 border-b border-white/[0.07] pr-4 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, i) => (
                      <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length].bg} ${avatarColors[i % avatarColors.length].text}`}>
                              {client.company.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium text-[#CBD5E1] whitespace-nowrap">{client.company}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-xs font-medium text-[#94A3B8]">{client.contact}</p>
                          <p className="text-[10px] text-[#334155]">{client.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#475569]">{client.industry}</td>
                        <td className="py-3 pr-4 text-sm font-semibold text-[#F1F5F9]">{client.value}</td>
                        <td className="py-3 pr-4 text-xs text-[#475569]">{client.since}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge[client.status]}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-white/[0.06] text-[#94A3B8] text-[10px] font-medium hover:bg-white/10 transition-colors">View</button>
                            <button className="px-2 py-1 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] font-medium hover:bg-[#C9A84C]/20 transition-colors">Deal</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DEALS ─────────────────────────────────────────────────────── */}
          {activeTab === 'Deals' && (
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDealFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        dealFilter === f
                          ? 'bg-[#C9A84C] text-[#0A0F1E]'
                          : 'bg-white/5 border border-white/[0.07] text-[#475569] hover:text-[#94A3B8]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-[#0D1425] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#CBD5E1] placeholder-[#334155] outline-none focus:border-[#C9A84C]/50 w-48 transition-colors"
                  />
                  <button className="bg-[#C9A84C] text-[#0A0F1E] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-[#b89640] transition-colors">
                    + New Deal
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Deal', 'Client', 'Value', 'Stage', 'Probability', 'Owner', 'Close Date', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wider font-semibold text-[#334155] uppercase pb-3 border-b border-white/[0.07] pr-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-3">
                          <p className="text-sm font-medium text-[#CBD5E1] max-w-[180px] truncate">{deal.title}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#475569] whitespace-nowrap">{deal.client}</td>
                        <td className="py-3 pr-3 text-sm font-semibold text-[#F1F5F9]">{deal.value}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge[deal.stage]}`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${deal.probability}%` }} />
                            </div>
                            <span className="text-xs text-[#475569]">{deal.probability}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#475569]">{deal.owner}</td>
                        <td className="py-3 pr-3 text-xs text-[#475569] whitespace-nowrap">{deal.closeDate}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-white/[0.06] text-[#94A3B8] text-[10px] font-medium hover:bg-white/10 transition-colors">Edit</button>
                            <button className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors">Close</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PIPELINE ──────────────────────────────────────────────────── */}
          {activeTab === 'Pipeline' && (
            <div>
              {/* Stage summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {pipeline.map((stage) => (
                  <div key={stage.stage} className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5 text-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color} mx-auto mb-2`} />
                    <p className="text-[10px] text-[#475569] font-semibold tracking-widest uppercase">{stage.stage}</p>
                    <p className="font-serif text-2xl text-[#F1F5F9] my-1">{stage.value}</p>
                    <p className="text-xs text-[#334155]">{stage.count} deals</p>
                  </div>
                ))}
              </div>
              {/* Kanban columns */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {pipeline.map((stage) => {
                  const style = pipelineStageStyle[stage.stage]
                  return (
                    <div key={stage.stage} className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4">
                      <div className={`flex items-center gap-2 mb-3 pb-2.5 border-b-2 ${style.border}`}>
                        <h3 className={`text-sm font-semibold ${style.text}`}>{stage.stage}</h3>
                        <span className="ml-auto w-5 h-5 rounded-md bg-white/[0.06] text-[#475569] text-[10px] font-bold flex items-center justify-center">
                          {stage.count}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {deals
                          .filter(d => d.stage === stage.stage.toLowerCase().replace(' ', '-'))
                          .map((deal) => (
                            <div key={deal.id} className="bg-[#0D1425] border border-white/[0.06] rounded-xl p-3">
                              <p className="text-xs font-medium text-[#CBD5E1] leading-snug mb-1">{deal.title}</p>
                              <p className="text-[10px] text-[#475569] mb-2">{deal.client}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#F1F5F9]">{deal.value}</span>
                                <span className={`text-[10px] ${deal.stage === 'closed-won' ? 'text-emerald-400' : 'text-[#475569]'}`}>
                                  {deal.stage === 'closed-won' ? 'Won ✓' : `${deal.probability}%`}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── INVOICES ──────────────────────────────────────────────────── */}
          {activeTab === 'Invoices' && (
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base text-[#F1F5F9]">B2B Invoices</h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Outstanding: <span className="text-red-400 font-medium">₹7.12L</span>
                    &nbsp;·&nbsp;
                    Collected: <span className="text-emerald-400 font-medium">₹4.17L</span>
                  </p>
                </div>
                <button className="bg-[#C9A84C] text-[#0A0F1E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#b89640] transition-colors">
                  + Create Invoice
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Invoice', 'Client', 'Service', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wider font-semibold text-[#334155] uppercase pb-3 border-b border-white/[0.07] pr-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr
                        key={inv.id}
                        className={`hover:bg-white/[0.02] transition-colors ${inv.status === 'overdue' ? 'bg-red-500/[0.03]' : ''}`}
                      >
                        <td className="py-3 pr-3 text-xs font-semibold text-[#C9A84C]">{inv.id}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length].bg} ${avatarColors[i % avatarColors.length].text}`}>
                              {inv.client.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-xs font-medium text-[#CBD5E1] whitespace-nowrap">{inv.client}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#475569] max-w-[140px] truncate">{inv.service}</td>
                        <td className="py-3 pr-3 text-sm font-semibold text-[#F1F5F9]">₹{inv.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-emerald-400">₹{inv.paid.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-3 text-sm text-red-400">
                          {inv.amount - inv.paid > 0 ? `₹${(inv.amount - inv.paid).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className={`py-3 pr-3 text-xs whitespace-nowrap ${inv.status === 'overdue' ? 'text-red-400' : 'text-[#475569]'}`}>
                          {inv.due}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge[inv.status]}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-white/[0.06] text-[#94A3B8] text-[10px] font-medium hover:bg-white/10 transition-colors">Send</button>
                            <button className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors">Collect</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ACTIVITIES ────────────────────────────────────────────────── */}
          {activeTab === 'Activities' && (
            <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base text-[#F1F5F9]">Activity Timeline</h3>
                <button className="bg-[#C9A84C] text-[#0A0F1E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#b89640] transition-colors">
                  + Log Activity
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4 p-4 bg-[#0D1425] border border-white/[0.06] rounded-xl">
                    <div className="w-10 h-10 bg-[#111827] border border-white/[0.07] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {activityIcon[act.type].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#CBD5E1]">{act.action}</p>
                      <p className="text-xs text-[#475569] mt-0.5">{act.client} — {act.person}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[#334155]">{act.time}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        act.type === 'deal'    ? 'bg-emerald-500/10 text-emerald-400' :
                        act.type === 'call'    ? 'bg-blue-500/10 text-blue-400' :
                        act.type === 'meeting' ? 'bg-purple-500/10 text-purple-400' :
                        act.type === 'invoice' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/[0.06] text-[#94A3B8]'
                      }`}>
                        {act.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}