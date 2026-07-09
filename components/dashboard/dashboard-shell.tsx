'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail] = useState('')
  const [userRole] = useState('user')
  const [userName] = useState('User')

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
