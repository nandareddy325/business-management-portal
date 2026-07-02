// FILE 4: app/(super-admin)/admin/dashboard/page.tsx (UPDATED)
// ---
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Activity, Zap, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react'
import { StatCards } from '@/components/super-admin/dashboard'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Fetch overall stats
  const { data: allUsers } = await supabase.from('profiles').select('id')
  const { data: allCompanies } = await supabase.from('companies').select('id')
  const { data: subscriptions } = await supabase
    .from('company_subscriptions')
    .select('*')
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/8 bg-[#F5F0E8]/95 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={11} className="text-amber-600" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-amber-700/70">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1712] tracking-tight">Admin Overview</h1>
          <p className="text-xs text-black/50 mt-2">Welcome back! Here's your system overview.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <StatCards stats={{
          totalRevenue: 450000,
          totalUsers: allUsers?.length || 0,
          activeSubscriptions: subscriptions?.length || 0,
          growthRate: 23.5,
        }} />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickStatCard icon={<Users size={18} />} title="Total Companies" value={allCompanies?.length || 0} color="blue" />
          <QuickStatCard icon={<Zap size={18} />} title="Active Users" value={Math.round((allUsers?.length || 0) * 0.65)} color="amber" />
          <QuickStatCard icon={<TrendingUp size={18} />} title="Monthly Revenue" value="₹45,000" color="emerald" />
          <QuickStatCard icon={<Clock size={18} />} title="Avg Response Time" value="2.4h" color="purple" />
          <QuickStatCard icon={<AlertCircle size={18} />} title="Active Alerts" value="3" color="red" />
          <QuickStatCard icon={<Activity size={18} />} title="System Health" value="98%" color="green" />
        </div>

        {/* Recent Activity */}
        <div className="bg-white ring-1 ring-black/8 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#1C1712] mb-5">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'New company registered', time: '2 hours ago', icon: '🏢' },
              { action: 'Payment processed successfully', time: '3 hours ago', icon: '💳' },
              { action: 'System backup completed', time: '5 hours ago', icon: '💾' },
              { action: 'New support ticket created', time: '6 hours ago', icon: '🎫' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-black/8 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm font-medium text-black/80">{item.action}</p>
                </div>
                <p className="text-xs text-black/50">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickStatCard({ icon, title, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
  }

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color] || colorClasses.blue} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-[10px] font-semibold text-black/60 uppercase">{title}</p>
      <p className="text-2xl font-bold text-black/80 mt-2">{value}</p>
    </div>
  )
}