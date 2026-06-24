// app/(dashboard)/layout.tsx
// Uses YOUR existing Header + Sidebar components

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?error=suspended')

  // Trial check
  const { data: company } = await supabase
    .from('companies')
    .select('plan_status, trial_ends_at')
    .eq('id', profile.company_id)
    .single()

  if (company?.plan_status === 'trial') {
    const trialEnd = new Date(company.trial_ends_at)
    if (trialEnd < new Date()) redirect('/billing/trial-expired')
  }
  if (company?.plan_status === 'expired') redirect('/billing/trial-expired')

  return <DashboardShell>{children}</DashboardShell>
}

// Client wrapper — sidebar state management
'use client'
import { useState } from 'react'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('User')

  return (
    <div className="flex h-screen bg-[#F7F5F1] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset for sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
         <Header onMenuClick={() => setSidebarOpen(true)}
        userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          title="Real Estate"
          subtitle="CRM Portal"
           />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
