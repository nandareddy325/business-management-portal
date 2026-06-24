'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getIndustry } from '@/lib/industries'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import type { Industry } from '@/types'

interface Props {
  industry: Industry
}

export function IndustryDashboard({ industry }: Props) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('User')
  const config = getIndustry(industry.id)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])
    }
    getUser()
  }, [router])

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex">
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

          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl text-[#111]">Welcome back, {userName} 👋</h1>
              <p className="text-sm text-[#888] mt-1">Here is your {config.name} portal overview</p>
            </div>
            <div className={`flex items-center gap-2.5 ${config.bg} px-4 py-2 rounded-xl`}>
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className="text-[10px] text-[#888] uppercase tracking-wide">Industry</p>
                <p className={`text-[13px] font-semibold ${config.color}`}>{config.name}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {config.stats.map((stat, i) => (
              <div key={i} className="bg-white border border-[#E8E2D8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <p className="text-xs text-[#888] font-medium">{stat.label}</p>
                <p className="font-serif text-[28px] text-[#111] my-1 leading-none">{stat.value}</p>
                <p className="text-xs text-emerald-600 font-medium">↑ Growing</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5">
              <h3 className="font-serif text-base text-[#111] mb-4">Recent Activity</h3>
              <div className="flex flex-col gap-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F0EBE0] last:border-0">
                    <div className={`w-8 h-8 rounded-full ${config.bg} ${config.color} flex items-center justify-center text-sm flex-shrink-0`}>{config.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111]">New {config.stats[0].label.toLowerCase()} added</p>
                      <p className="text-xs text-[#888]">{i * 2} hours ago</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">New</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5">
              <h3 className="font-serif text-base text-[#111] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {config.stats.slice(0, 4).map((stat, i) => (
                  <button key={i} className={`p-4 rounded-xl ${config.bg} text-left hover:opacity-80 transition-all`}>
                    <p className="text-2xl mb-2">{config.icon}</p>
                    <p className={`text-[13px] font-semibold ${config.color}`}>Add {stat.label}</p>
                    <p className="text-[11px] text-[#888] mt-0.5">Current: {stat.value}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}