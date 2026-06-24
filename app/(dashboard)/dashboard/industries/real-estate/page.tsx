'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

const properties = [
  { id: '1', name: 'Prestige Lake Ridge', location: 'Gachibowli, Hyderabad', type: '3BHK', price: '₹85L', status: 'available', area: '1850 sqft' },
  { id: '2', name: 'My Home Bhooja', location: 'Kondapur, Hyderabad', type: '4BHK', price: '₹1.2Cr', status: 'sold', area: '2400 sqft' },
  { id: '3', name: 'Aparna Sarovar', location: 'Nallagandla, Hyderabad', type: '2BHK', price: '₹55L', status: 'available', area: '1250 sqft' },
  { id: '4', name: 'Cybercity Towers', location: 'HITEC City, Hyderabad', type: 'Commercial', price: '₹2.5Cr', status: 'negotiation', area: '5000 sqft' },
  { id: '5', name: 'Green Valley Villas', location: 'Shamshabad, Hyderabad', type: 'Villa', price: '₹1.8Cr', status: 'available', area: '3200 sqft' },
]

const leads = [
  { id: '1', name: 'Ravi Kumar', phone: '+91 98765 43210', email: 'ravi@gmail.com', interest: '3BHK Gachibowli', budget: '₹80-90L', status: 'hot', source: 'Instagram', date: '03 Jun 2026' },
  { id: '2', name: 'Sunitha Reddy', phone: '+91 87654 32109', email: 'sunitha@gmail.com', interest: '4BHK Kondapur', budget: '₹1-1.5Cr', status: 'warm', source: 'Referral', date: '02 Jun 2026' },
  { id: '3', name: 'Mohammed Ali', phone: '+91 76543 21098', email: 'ali@gmail.com', interest: 'Commercial HITEC', budget: '₹2-3Cr', status: 'new', source: 'MagicBricks', date: '02 Jun 2026' },
  { id: '4', name: 'Priya Sharma', phone: '+91 65432 10987', email: 'priya@gmail.com', interest: 'Villa Shamshabad', budget: '₹1.5-2Cr', status: 'hot', source: 'Google Ads', date: '01 Jun 2026' },
  { id: '5', name: 'Venkat Rao', phone: '+91 54321 09876', email: 'venkat@gmail.com', interest: '2BHK Nallagandla', budget: '₹50-60L', status: 'cold', source: '99acres', date: '31 May 2026' },
]

const siteVisits = [
  { id: '1', client: 'Ravi Kumar', property: 'Prestige Lake Ridge', date: '05 Jun 2026', time: '10:00 AM', agent: 'Anjali S.', status: 'scheduled' },
  { id: '2', client: 'Priya Sharma', property: 'Green Valley Villas', date: '06 Jun 2026', time: '3:00 PM', agent: 'Ravi K.', status: 'scheduled' },
  { id: '3', client: 'Sunitha Reddy', property: 'My Home Bhooja', date: '04 Jun 2026', time: '11:00 AM', agent: 'Meena T.', status: 'completed' },
  { id: '4', client: 'Mohammed Ali', property: 'Cybercity Towers', date: '07 Jun 2026', time: '2:00 PM', agent: 'Arjun S.', status: 'scheduled' },
]

const recentDeals = [
  { id: '1', property: 'My Home Bhooja', client: 'Kiran Reddy', value: '₹1.2Cr', commission: '₹1.44L', date: '01 Jun 2026', status: 'closed' },
  { id: '2', property: 'Aparna Sarovar', client: 'Lakshmi D.', value: '₹55L', commission: '₹66K', date: '28 May 2026', status: 'closed' },
  { id: '3', property: 'Prestige Lake Ridge', client: 'Arjun Mehta', value: '₹85L', commission: '₹1.02L', date: '25 May 2026', status: 'closed' },
]

const statusStyle: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700',
  sold: 'bg-[#F0EBE0] text-[#7A6E60]',
  negotiation: 'bg-amber-50 text-amber-700',
  hot: 'bg-red-50 text-red-700',
  warm: 'bg-amber-50 text-amber-700',
  new: 'bg-blue-50 text-blue-700',
  cold: 'bg-[#F0EBE0] text-[#7A6E60]',
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-emerald-50 text-emerald-700',
}

const avatarColors = [
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-purple-50 text-purple-700',
  'bg-amber-50 text-amber-700',
  'bg-red-50 text-red-700',
]

const tabs = ['Overview', 'Properties', 'Leads', 'Site Visits', 'Deals']

export default function RealEstateDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('User')
  const [search, setSearch] = useState('')
  const [leadFilter, setLeadFilter] = useState('All')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?industry=real-estate'); return }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
    }
    getUser()
  }, [router])

  const filteredLeads = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.interest.toLowerCase().includes(search.toLowerCase())
    const matchFilter = leadFilter === 'All' || l.status === leadFilter.toLowerCase()
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-[220px] flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)}
        userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          title="Real Estate"
          subtitle="CRM Portal"
           />
        <main className="flex-1 p-5 md:p-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl text-[#1C1712]">Welcome back, {userName} 👋</h1>
              <p className="text-sm text-[#7A6E60] mt-1">Real Estate CRM Portal — GK Digital Solutions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
                <span className="text-xl">🏢</span>
                <div>
                  <p className="text-[10px] text-[#888] uppercase tracking-wide">Industry</p>
                  <p className="text-[13px] font-semibold text-blue-700">Real Estate</p>
                </div>
              </div>
              <button className="bg-[#1C1712] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d2822] transition-colors">+ Add Lead</button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Properties', value: '48', change: '+4 this month', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏢' },
              { label: 'Active Leads', value: '124', change: '+18 this week', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🎯' },
              { label: 'Site Visits', value: '38', change: '+6 scheduled', color: 'text-amber-600', bg: 'bg-amber-50', icon: '📍' },
              { label: 'Revenue', value: '₹12.8L', change: '+22% this month', color: 'text-purple-600', bg: 'bg-purple-50', icon: '₹' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg mb-3`}>{stat.icon}</div>
                <p className="text-xs text-[#7A6E60] font-medium">{stat.label}</p>
                <p className={`font-serif text-[28px] my-1 leading-none ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[#7A6E60]">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#1C1712] text-white' : 'bg-[#FDFAF4] border border-[#E2D9C8] text-[#7A6E60] hover:bg-[#F0EBE0]'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Recent Leads */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Recent Leads</h3>
                  <button onClick={() => setActiveTab('Leads')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-2">
                  {leads.slice(0, 4).map((lead, i) => (
                    <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-[#F0EBE0] last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712] truncate">{lead.name}</p>
                        <p className="text-xs text-[#7A6E60] truncate">{lead.interest}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[lead.status]}`}>{lead.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Site Visits */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Upcoming Site Visits</h3>
                  <button onClick={() => setActiveTab('Site Visits')} className="text-xs text-[#B8860B] hover:underline">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {siteVisits.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📍</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712] truncate">{visit.client}</p>
                        <p className="text-xs text-[#7A6E60] truncate">{visit.property}</p>
                        <p className="text-[11px] text-[#B8860B] font-medium">{visit.date} — {visit.time}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[visit.status]}`}>{visit.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Deals */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base text-[#1C1712]">Recent Deals Closed</h3>
                  <span className="text-xs text-emerald-600 font-semibold">+3 this month</span>
                </div>
                <div className="flex flex-col gap-3">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-3 py-2 border-b border-[#F0EBE0] last:border-0">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-sm flex-shrink-0">🏠</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1712] truncate">{deal.property}</p>
                        <p className="text-xs text-[#7A6E60]">{deal.client} — {deal.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[#1C1712]">{deal.value}</p>
                        <p className="text-[11px] text-emerald-600">Commission: {deal.commission}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Summary */}
              <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
                <h3 className="font-serif text-base text-[#1C1712] mb-4">Pipeline Summary</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Hot Leads', count: 2, value: '₹2.7Cr', color: 'bg-red-500' },
                    { label: 'Warm Leads', count: 1, value: '₹1.2Cr', color: 'bg-amber-500' },
                    { label: 'New Leads', count: 1, value: '₹2.5Cr', color: 'bg-blue-500' },
                    { label: 'Cold Leads', count: 1, value: '₹55L', color: 'bg-[#7A6E60]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <p className="text-sm text-[#1C1712] font-medium w-24 flex-shrink-0">{item.label}</p>
                      <div className="flex-1 h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs text-[#7A6E60] w-16 text-right">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROPERTIES TAB */}
          {activeTab === 'Properties' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base text-[#1C1712]">All Properties</h3>
                <button className="bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#2d2822]">+ Add Property</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Property', 'Location', 'Type', 'Area', 'Price', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-sm flex-shrink-0">🏢</div>
                            <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{prop.name}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#7A6E60] whitespace-nowrap">{prop.location}</td>
                        <td className="py-3 pr-4 text-xs text-[#7A6E60]">{prop.type}</td>
                        <td className="py-3 pr-4 text-xs text-[#7A6E60]">{prop.area}</td>
                        <td className="py-3 pr-4 text-sm font-semibold text-[#1C1712]">{prop.price}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[prop.status]}`}>{prop.status}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2.5 py-1 rounded-lg bg-[#F0EBE0] text-[#1C1712] text-[11px] font-medium hover:bg-[#E8E0D0]">View</button>
                            <button className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === 'Leads' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Hot', 'Warm', 'New', 'Cold'].map((f) => (
                    <button key={f} onClick={() => setLeadFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${leadFilter === f ? 'bg-[#1C1712] text-white' : 'bg-[#F0EBE0] text-[#7A6E60] hover:bg-[#E8E0D0]'}`}>{f}</button>
                  ))}
                </div>
                <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#F5F0E8] border border-[#E2D9C8] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#B8860B] w-full sm:w-48" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Name', 'Contact', 'Interest', 'Budget', 'Source', 'Status', 'Date', 'Action'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, i) => (
                      <tr key={lead.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                              {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="text-sm font-medium text-[#1C1712] whitespace-nowrap">{lead.name}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-xs text-[#1C1712]">{lead.phone}</p>
                          <p className="text-[10px] text-[#7A6E60]">{lead.email}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] max-w-[120px] truncate">{lead.interest}</td>
                        <td className="py-3 pr-3 text-xs font-medium text-[#1C1712]">{lead.budget}</td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60]">{lead.source}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle[lead.status]}`}>{lead.status}</span>
                        </td>
                        <td className="py-3 pr-3 text-xs text-[#7A6E60] whitespace-nowrap">{lead.date}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button className="px-2 py-1 rounded-lg bg-[#F0EBE0] text-[#1C1712] text-[10px] font-medium hover:bg-[#E8E0D0]">Edit</button>
                            <button className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-medium hover:bg-emerald-100">Convert</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SITE VISITS TAB */}
          {activeTab === 'Site Visits' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base text-[#1C1712]">Site Visits</h3>
                <button className="bg-[#1C1712] text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Schedule Visit</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {siteVisits.map((visit, i) => (
                  <div key={visit.id} className="p-4 bg-[#F5F0E8] border border-[#E2D9C8] rounded-2xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${avatarColors[i % avatarColors.length]}`}>📍</div>
                        <div>
                          <p className="text-sm font-semibold text-[#1C1712]">{visit.client}</p>
                          <p className="text-xs text-[#7A6E60]">{visit.property}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusStyle[visit.status]}`}>{visit.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[#7A6E60]">
                        <span>📅</span> {visit.date}
                      </div>
                      <div className="flex items-center gap-1 text-[#7A6E60]">
                        <span>⏰</span> {visit.time}
                      </div>
                      <div className="flex items-center gap-1 text-[#7A6E60] col-span-2">
                        <span>👤</span> Agent: {visit.agent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEALS TAB */}
          {activeTab === 'Deals' && (
            <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base text-[#1C1712]">Deals Closed</h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">Total Commission: ₹3.12L this month</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">3 Closed</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Property', 'Client', 'Deal Value', 'Commission', 'Date', 'Status'].map((h) => (
                        <th key={h} className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-3 border-b border-[#E2D9C8] pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-xs">🏠</div>
                            <p className="text-sm font-medium text-[#1C1712]">{deal.property}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-[#7A6E60]">{deal.client}</td>
                        <td className="py-3 pr-4 text-sm font-semibold text-[#1C1712]">{deal.value}</td>
                        <td className="py-3 pr-4 text-sm font-semibold text-emerald-600">{deal.commission}</td>
                        <td className="py-3 pr-4 text-xs text-[#7A6E60]">{deal.date}</td>
                        <td className="py-3">
                          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">Closed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}